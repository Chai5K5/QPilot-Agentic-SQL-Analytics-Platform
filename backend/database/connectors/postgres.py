import logging
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

try:
    from backend.config import settings
except ImportError:
    from config import settings

from backend.database.manager import DatabaseManager

logger = logging.getLogger(__name__)


class PostgreSQLConnector(DatabaseManager):
    """
    PostgreSQL implementation of the DatabaseManager interface.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        dbname: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.host = host or settings.DB_HOST
        self.port = port or (settings.DB_PORT if hasattr(settings, "DB_PORT") else 5432)
        self.dbname = dbname or settings.DB_NAME
        self.user = user or settings.DB_USER
        self.password = password or settings.DB_PASSWORD
        self.connection = None

    def connect(self):
        """
        Establish a connection to the PostgreSQL database.
        """
        try:
            self.connection = psycopg.connect(
                host=self.host,
                port=self.port,
                dbname=self.dbname,
                user=self.user,
                password=self.password,
            )
            logger.info("Successfully connected to PostgreSQL.")
            return self.connection
        except psycopg.Error:
            logger.exception("Failed to connect to PostgreSQL.")
            raise

    def disconnect(self):
        """
        Close the PostgreSQL database connection.
        """
        if self.connection is None:
            logger.warning("No active PostgreSQL connection to close.")
            return

        try:
            self.connection.close()
            logger.info("PostgreSQL connection closed successfully.")
        except psycopg.Error:
            logger.exception("Failed to close PostgreSQL connection.")
            raise
        finally:
            self.connection = None

    def test_connection(self) -> bool:
        """
        Test if the PostgreSQL connection is active and responsive.
        """
        try:
            if not self.connection or self.connection.closed:
                self.connect()
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"PostgreSQL connection test failed: {e}")
            return False

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return results as a list of dictionaries.
        """
        if not self.connection or self.connection.closed:
            self.connect()

        try:
            with self.connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    return list(cursor.fetchall())
                self.connection.commit()
                return []
        except psycopg.Error as e:
            logger.exception(f"Error executing PostgreSQL query: {query}")
            raise

    def list_tables(self) -> List[str]:
        """
        List all base tables in the public schema.
        """
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """
        results = self.execute_query(query)
        return [row["table_name"] for row in results]

    def describe_table(self, table_name: str) -> Dict[str, Any]:
        """
        Get column information and primary keys for a specified table.
        """
        cols_query = """
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """
        columns = self.execute_query(cols_query, (table_name,))

        pk_query = """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
              AND tc.table_name = %s;
        """
        pks = [row["column_name"] for row in self.execute_query(pk_query, (table_name,))]

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