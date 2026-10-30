import logging
from typing import Any, Dict, List, Optional
import pymysql
import pymysql.cursors

from database.manager import DatabaseManager

logger = logging.getLogger(__name__)


class MySQLConnector(DatabaseManager):
    """
    MySQL implementation of the DatabaseManager interface.
    """

    def __init__(
        self,
        host: Optional[str] = "localhost",
        port: Optional[int] = 3306,
        dbname: Optional[str] = None,
        user: Optional[str] = "root",
        password: Optional[str] = "",
        **kwargs
    ):
        self.host = host or "localhost"
        self.port = int(port or 3306)
        self.dbname = dbname or ""
        self.user = user or "root"
        self.password = password or ""
        self.connection = None

    def connect(self):
        """
        Establish a connection to the MySQL database.
        """
        try:
            self.connection = pymysql.connect(
                host=self.host,
                port=self.port,
                database=self.dbname if self.dbname else None,
                user=self.user,
                password=self.password,
                cursorclass=pymysql.cursors.DictCursor,
                charset="utf8mb4",
                connect_timeout=5,
            )
            logger.info("Successfully connected to MySQL database.")
            return self.connection
        except Exception:
            logger.exception("Failed to connect to MySQL database.")
            raise

    def disconnect(self):
        """
        Close the MySQL database connection.
        """
        if self.connection is None:
            return

        try:
            self.connection.close()
            logger.info("MySQL connection closed successfully.")
        except Exception:
            logger.exception("Failed to close MySQL connection.")
            raise
        finally:
            self.connection = None

    def test_connection(self) -> bool:
        """
        Test if the MySQL connection is active and responsive.
        """
        try:
            if not self.connection or not self.connection.open:
                self.connect()
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"MySQL connection test failed: {e}")
            return False

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return results as a list of dictionaries.
        """
        if not self.connection or not self.connection.open:
            self.connect()

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    return list(cursor.fetchall())
                self.connection.commit()
                return []
        except Exception as e:
            logger.exception(f"Error executing MySQL query: {query}")
            raise

    def list_tables(self) -> List[str]:
        """
        List all tables in the current MySQL database.
        """
        if not self.dbname:
            query = "SHOW TABLES;"
            results = self.execute_query(query)
            tables = []
            for row in results:
                tables.extend(list(row.values()))
            return tables

        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = %s AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """
        results = self.execute_query(query, (self.dbname,))
        return [row["TABLE_NAME"] if "TABLE_NAME" in row else row["table_name"] for row in results]

    def describe_table(self, table_name: str) -> Dict[str, Any]:
        """
        Get column information and primary keys for a specified table.
        """
        cols_query = """
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default,
                column_key
            FROM information_schema.columns
            WHERE table_name = %s
        """
        params = [table_name]
        if self.dbname:
            cols_query += " AND table_schema = %s"
            params.append(self.dbname)
        cols_query += " ORDER BY ordinal_position;"

        results = self.execute_query(cols_query, tuple(params))
        columns = []
        pks = []
        for col in results:
            col_name = col.get("COLUMN_NAME") or col.get("column_name")
            data_type = col.get("DATA_TYPE") or col.get("data_type")
            is_null = col.get("IS_NULLABLE") or col.get("is_nullable")
            col_key = col.get("COLUMN_KEY") or col.get("column_key")
            default_val = col.get("COLUMN_DEFAULT") or col.get("column_default")

            columns.append({
                "column_name": col_name,
                "data_type": data_type,
                "is_nullable": "YES" if is_null == "YES" else "NO",
                "column_default": default_val
            })
            if col_key == "PRI":
                pks.append(col_name)

        return {
            "table_name": table_name,
            "columns": columns,
            "primary_keys": pks,
        }

    def get_schema(self) -> Dict[str, Any]:
        """
        Get full database schema containing all tables and column metadata.
        """
        tables = self.list_tables()
        schema = {}
        for table in tables:
            schema[table] = self.describe_table(table)
        return schema

