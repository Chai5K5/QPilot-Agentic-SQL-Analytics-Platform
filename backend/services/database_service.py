import csv
import io
import logging
import os
from pathlib import Path
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional, Tuple

from database.connectors import get_database_connector
from database.connectors.sqlite import SQLiteConnector
from database.manager import DatabaseManager

logger = logging.getLogger(__name__)

# Directory to store user-uploaded datasets
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Active database connector and metadata
_active_connector: Optional[DatabaseManager] = None
_active_connection_info: Dict[str, Any] = {
    "id": "none",
    "name": "No Connection",
    "type": "none",
    "database": "",
    "status": "disconnected",
    "lastChecked": None,
    "tableCount": 0,
}


def sanitize_identifier(name: str) -> str:
    """
    Sanitize an identifier (table name or column name) to contain only safe chars.
    """
    clean = re.sub(r"[^\w]+", "_", name.strip())
    clean = clean.strip("_")
    if not clean or clean[0].isdigit():
        clean = "t_" + clean
    return clean.lower()


def infer_column_type(values: List[str]) -> str:
    """
    Infer SQLite column type from non-empty string samples.
    """
    non_empty = [v.strip() for v in values if v is not None and v.strip() != ""]
    if not non_empty:
        return "TEXT"

    is_int = True
    for v in non_empty:
        try:
            int(v)
        except ValueError:
            is_int = False
            break
    if is_int:
        return "INTEGER"

    is_float = True
    for v in non_empty:
        try:
            float(v)
        except ValueError:
            is_float = False
            break
    if is_float:
        return "REAL"

    return "TEXT"


def import_csv_to_sqlite(file_content: bytes, filename: str, table_name: Optional[str] = None) -> Tuple[str, str, int, List[str]]:
    """
    Imports CSV file bytes into a local SQLite database file in UPLOADS_DIR.
    Returns: (db_path, table_name, row_count, column_names)
    """
    # Detect encoding
    for encoding in ("utf-8-sig", "utf-8", "latin1", "cp1252"):
        try:
            text = file_content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = file_content.decode("utf-8", errors="replace")

    # Read CSV
    f = io.StringIO(text)
    # Detect delimiter
    try:
        sample = text[:4096]
        dialect = csv.Sniffer().sniff(sample)
        reader = csv.reader(f, dialect)
    except Exception:
        f.seek(0)
        reader = csv.reader(f)

    try:
        raw_headers = next(reader)
    except StopIteration:
        raise ValueError("The uploaded CSV file is empty.")

    clean_headers = []
    seen = set()
    for i, h in enumerate(raw_headers):
        col_name = sanitize_identifier(h) or f"col_{i+1}"
        orig = col_name
        cnt = 1
        while col_name in seen:
            col_name = f"{orig}_{cnt}"
            cnt += 1
        seen.add(col_name)
        clean_headers.append(col_name)

    rows = list(reader)
    row_count = len(rows)

    # Infer column types using up to 100 sample rows
    sample_rows = rows[:100]
    col_types = []
    for col_idx in range(len(clean_headers)):
        col_values = [row[col_idx] for row in sample_rows if col_idx < len(row)]
        col_types.append(infer_column_type(col_values))

    # Determine table name
    if not table_name:
        stem = Path(filename).stem
        table_name = sanitize_identifier(stem) or "uploaded_data"
    else:
        table_name = sanitize_identifier(table_name)

    # We store uploaded CSVs in user_uploads.db so users can upload multiple files/tables
    db_file = UPLOADS_DIR / "user_uploads.db"
    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()

    # Drop existing table if any and create new
    cursor.execute(f'DROP TABLE IF EXISTS "{table_name}";')

    columns_ddl = ", ".join([f'"{h}" {t}' for h, t in zip(clean_headers, col_types)])
    cursor.execute(f'CREATE TABLE "{table_name}" ({columns_ddl});')

    # Normalize rows to match headers length
    num_cols = len(clean_headers)
    prepared_rows = []
    for row in rows:
        if len(row) < num_cols:
            row = row + [None] * (num_cols - len(row))
        elif len(row) > num_cols:
            row = row[:num_cols]
        # Cast types where applicable
        typed_row = []
        for val, t in zip(row, col_types):
            if val is None or val.strip() == "":
                typed_row.append(None)
            elif t == "INTEGER":
                try:
                    typed_row.append(int(val))
                except ValueError:
                    typed_row.append(val)
            elif t == "REAL":
                try:
                    typed_row.append(float(val))
                except ValueError:
                    typed_row.append(val)
            else:
                typed_row.append(val)
        prepared_rows.append(tuple(typed_row))

    placeholders = ", ".join(["?"] * num_cols)
    cursor.executemany(f'INSERT INTO "{table_name}" VALUES ({placeholders});', prepared_rows)
    conn.commit()
    conn.close()

    return str(db_file), table_name, row_count, clean_headers


def load_csv(file_content: bytes, filename: str, table_name: Optional[str] = None) -> Tuple[bool, str, Dict[str, Any], Dict[str, Any]]:
    """
    Loads uploaded CSV file, registers it into SQLite, and sets as active database.
    """
    global _active_connector, _active_connection_info

    try:
        db_path, tbl_name, row_count, headers = import_csv_to_sqlite(file_content, filename, table_name)
        connector = SQLiteConnector(db_path=db_path)
        connector.connect()

        schema = connector.get_schema()
        table_count = len(schema)

        _active_connector = connector
        _active_connection_info = {
            "id": f"csv-{int(time.time())}",
            "name": f"CSV: {filename}",
            "type": "sqlite",
            "database": Path(db_path).name,
            "filePath": db_path,
            "status": "connected",
            "lastChecked": "Just now",
            "tableCount": table_count,
            "uploadedTable": tbl_name,
            "rowCount": row_count,
        }

        return True, f"Successfully uploaded '{filename}' as table '{tbl_name}' with {row_count} rows.", _active_connection_info, schema
    except Exception as e:
        logger.exception("Failed to process CSV file.")
        return False, f"Error processing CSV: {str(e)}", {}, {}


def load_sqlite_file(file_content: bytes, filename: str) -> Tuple[bool, str, Dict[str, Any], Dict[str, Any]]:
    """
    Saves and connects an uploaded SQLite database file (.db or .sqlite).
    """
    global _active_connector, _active_connection_info

    try:
        clean_name = sanitize_identifier(Path(filename).stem) + ".db"
        target_path = UPLOADS_DIR / clean_name
        with open(target_path, "wb") as f:
            f.write(file_content)

        connector = SQLiteConnector(db_path=str(target_path))
        connector.connect()
        schema = connector.get_schema()
        table_count = len(schema)

        _active_connector = connector
        _active_connection_info = {
            "id": f"sqlite-{int(time.time())}",
            "name": f"SQLite: {filename}",
            "type": "sqlite",
            "database": clean_name,
            "filePath": str(target_path),
            "status": "connected",
            "lastChecked": "Just now",
            "tableCount": table_count,
        }

        return True, f"Successfully connected to SQLite file with {table_count} tables.", _active_connection_info, schema
    except Exception as e:
        logger.exception("Failed to process SQLite file.")
        return False, f"Error processing SQLite file: {str(e)}", {}, {}


def test_connection_config(config: Dict[str, Any]) -> Tuple[bool, str, float, int]:
    """
    Tests a connection config without mutating the active database.
    Returns: (is_success, message, latency_ms, table_count)
    """
    db_type = config.get("type", "").lower()
    start = time.perf_counter()

    try:
        kwargs = {
            "host": config.get("host"),
            "port": config.get("port"),
            "dbname": config.get("database"),
            "user": config.get("username"),
            "password": config.get("password"),
            "ssl": config.get("ssl"),
        }
        if db_type == "sqlite":
            file_path = config.get("filePath") or config.get("database") or ":memory:"
            kwargs = {"db_path": file_path}

        connector = get_database_connector(db_type, **kwargs)
        connector.connect()
        is_ok = connector.test_connection()
        tables = connector.list_tables()
        connector.disconnect()

        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        if is_ok:
            return True, f"Connection successful! Found {len(tables)} tables ({latency_ms}ms).", latency_ms, len(tables)
        else:
            return False, "Connection test failed: Server did not respond to ping query.", latency_ms, 0
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.warning(f"Connection test error for {db_type}: {e}")
        return False, f"Connection error: {str(e)}", latency_ms, 0


def connect_database(config: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any], Dict[str, Any]]:
    """
    Connects to the database specified by config and makes it the active database.
    """
    global _active_connector, _active_connection_info

    db_type = config.get("type", "").lower()
    name = config.get("name") or f"{db_type.capitalize()} Connection"

    try:
        kwargs = {
            "host": config.get("host"),
            "port": config.get("port"),
            "dbname": config.get("database"),
            "user": config.get("username"),
            "password": config.get("password"),
            "ssl": config.get("ssl"),
        }
        if db_type == "sqlite":
            file_path = config.get("filePath") or config.get("database") or ":memory:"
            kwargs = {"db_path": file_path}

        connector = get_database_connector(db_type, **kwargs)
        connector.connect()
        schema = connector.get_schema()
        table_count = len(schema)

        # Disconnect old connector if active
        if _active_connector:
            try:
                _active_connector.disconnect()
            except Exception:
                pass

        _active_connector = connector
        _active_connection_info = {
            "id": config.get("id") or f"conn-{int(time.time())}",
            "name": name,
            "type": db_type,
            "database": config.get("database", ""),
            "host": config.get("host"),
            "port": config.get("port"),
            "username": config.get("username"),
            "filePath": config.get("filePath"),
            "ssl": config.get("ssl"),
            "status": "connected",
            "lastChecked": "Just now",
            "tableCount": table_count,
        }

        return True, f"Connected to {name} with {table_count} tables loaded.", _active_connection_info, schema
    except Exception as e:
        logger.exception("Failed to connect to database.")
        return False, f"Connection failed: {str(e)}", {}, {}


def get_database() -> Optional[DatabaseManager]:
    """
    Returns the currently active DatabaseManager, or None if no connection is active.
    """
    global _active_connector
    return _active_connector


def get_active_schema() -> Dict[str, Any]:
    """
    Returns schema dictionary for the active database.
    """
    global _active_connector
    if not _active_connector:
        return {}
    try:
        return _active_connector.get_schema()
    except Exception as e:
        logger.error(f"Error fetching active schema: {e}")
        return {}


def get_active_connection_info() -> Dict[str, Any]:
    """
    Returns metadata about current active connection.
    """
    global _active_connection_info
    return _active_connection_info



def list_available_databases(config: Dict[str, Any]) -> Tuple[bool, str, List[str]]:
    """
    Connects to the specified database server (e.g. PostgreSQL or MySQL)
    and queries the server catalog to return all databases available to the user.
    """
    db_type = config.get("type", "").lower()
    host = config.get("host") or "localhost"
    port = config.get("port")
    user = config.get("username")
    password = config.get("password") or ""
    ssl = config.get("ssl")

    if db_type in ("postgres", "postgresql"):
        try:
            port = int(port or 5432)
            user = user or "postgres"
            initial_db = config.get("database") or "postgres"

            conn_kwargs = {
                "host": host,
                "port": port,
                "dbname": initial_db,
                "user": user,
                "password": password,
                "connect_timeout": 5,
            }
            if ssl is False:
                conn_kwargs["sslmode"] = "disable"
            elif ssl is True:
                conn_kwargs["sslmode"] = "prefer"

            import psycopg
            try:
                conn = psycopg.connect(**conn_kwargs)
            except Exception:
                # If initial_db didn't exist, try template1
                if initial_db != "template1":
                    conn_kwargs["dbname"] = "template1"
                    conn = psycopg.connect(**conn_kwargs)
                else:
                    raise

            with conn.cursor() as cur:
                cur.execute(
                    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
                )
                databases = [row[0] for row in cur.fetchall()]
            conn.close()
            return True, f"Found {len(databases)} database(s) on PostgreSQL server.", databases
        except Exception as e:
            logger.warning(f"Failed to list PostgreSQL databases: {e}")
            return False, f"Could not list databases: {str(e)}", []

    elif db_type == "mysql":
        try:
            port = int(port or 3306)
            user = user or "root"
            import pymysql

            conn = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                connect_timeout=5,
            )
            with conn.cursor() as cur:
                cur.execute("SHOW DATABASES;")
                system_dbs = {"information_schema", "performance_schema", "mysql", "sys"}
                databases = [row[0] for row in cur.fetchall() if row[0] not in system_dbs]
            conn.close()
            return True, f"Found {len(databases)} database(s) on MySQL server.", databases
        except Exception as e:
            logger.warning(f"Failed to list MySQL databases: {e}")
            return False, f"Could not list databases: {str(e)}", []

    elif db_type in ("sqlite", "csv"):
        found_dbs = []
        for search_dir in (BASE_DIR, UPLOADS_DIR, BASE_DIR.parent):
            if search_dir.exists():
                for p in search_dir.glob("*.db"):
                    found_dbs.append(p.name)
                for p in search_dir.glob("*.sqlite*"):
                    found_dbs.append(p.name)
        dbs = sorted(list(set(found_dbs)))
        return True, f"Found {len(dbs)} local SQLite database file(s).", dbs

    return False, f"Unsupported database engine '{db_type}'.", []
