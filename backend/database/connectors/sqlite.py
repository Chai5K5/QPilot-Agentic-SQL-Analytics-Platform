import logging
import sqlite3
from typing import Any, Dict, List, Optional

from database.manager import DatabaseManager

logger = logging.getLogger(__name__)


class SQLiteConnector(DatabaseManager):
    """
    SQLite implementation of the DatabaseManager interface.
    """

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self.connection = None

    def connect(self):
        """
        Establish a connection to the SQLite database.
        """
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Successfully connected to SQLite database at {self.db_path}.")
            return self.connection
        except sqlite3.Error:
            logger.exception(f"Failed to connect to SQLite database at {self.db_path}.")
            raise

    def disconnect(self):
        """
        Close the SQLite database connection.
        """
        if self.connection is None:
            logger.warning("No active SQLite connection to close.")
            return

        try:
            self.connection.close()
            logger.info("SQLite connection closed successfully.")
        except sqlite3.Error:
            logger.exception("Failed to close SQLite connection.")
            raise
        finally:
            self.connection = None

    def test_connection(self) -> bool:
        """
        Test if the SQLite connection is active and responsive.
        """
        try:
            if not self.connection:
                self.connect()
            cursor = self.connection.cursor()
            cursor.execute("SELECT 1;")
            return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"SQLite connection test failed: {e}")
            return False

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return results as a list of dictionaries.
        """
        if not self.connection:
            self.connect()

        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            if cursor.description:
                rows = cursor.fetchall()
                return [dict(row) for row in rows]

            self.connection.commit()
            return []
        except sqlite3.Error as e:
            logger.exception(f"Error executing SQLite query: {query}")
            raise

    def list_tables(self) -> List[str]:
        """
        List all user tables in the SQLite database.
        """
        query = """
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        """
        results = self.execute_query(query)
        return [row["name"] for row in results]

    def describe_table(self, table_name: str) -> Dict[str, Any]:
        """
        Get column information and primary keys for a specified table using PRAGMA.
        """
        # Sanitize table name to prevent SQL injection in PRAGMA
        safe_table_name = table_name.replace('"', '""')
        pragma_query = f'PRAGMA table_info("{safe_table_name}");'
        table_info = self.execute_query(pragma_query)

        columns = []
        pks = []
        for col in table_info:
            columns.append({
                "column_name": col["name"],
                "data_type": col["type"],
                "is_nullable": "NO" if col["notnull"] == 1 else "YES",
                "column_default": col["dflt_value"]
            })
            if col["pk"] >= 1:
                pks.append(col["name"])

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
