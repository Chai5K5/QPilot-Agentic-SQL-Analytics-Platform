from database.connectors.postgres import PostgreSQLConnector
from database.connectors.sqlite import SQLiteConnector
from database.manager import DatabaseManager


def get_database_connector(db_type: str, **kwargs) -> DatabaseManager:
    """
    Factory function to instantiate the appropriate DatabaseManager implementation.

    Supported db_type: 'postgres', 'postgresql', 'sqlite'
    """
    db_type_lower = db_type.lower()
    if db_type_lower in ("postgres", "postgresql"):
        return PostgreSQLConnector(**kwargs)
    elif db_type_lower == "sqlite":
        return SQLiteConnector(**kwargs)
    else:
        raise ValueError(f"Unsupported database type: '{db_type}'. Supported: 'postgres', 'sqlite'")


__all__ = ["PostgreSQLConnector", "SQLiteConnector", "get_database_connector", "DatabaseManager"]
