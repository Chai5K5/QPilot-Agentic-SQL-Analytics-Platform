import os
import sys
from datetime import datetime
from decimal import Decimal

# Ensure backend directory is in sys.path for running tests directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import (
    SQLiteConnector,
    get_database_connector,
    validate_read_only,
    sanitize_query,
    serialize_results,
    format_schema_for_llm,
)


def test_sqlite_connector_and_schema():
    """Test SQLiteConnector connection, table creation, query execution, and schema extraction."""
    connector = SQLiteConnector(":memory:")
    connector.connect()

    assert connector.test_connection() is True

    # Create dummy table and insert data
    connector.execute_query(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER);"
    )
    connector.execute_query(
        "INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25);"
    )

    # Test list_tables
    tables = connector.list_tables()
    assert "users" in tables

    # Test describe_table
    table_info = connector.describe_table("users")
    assert table_info["table_name"] == "users"
    assert "id" in table_info["primary_keys"]
    col_names = [col["column_name"] for col in table_info["columns"]]
    assert "name" in col_names and "age" in col_names

    # Test execute_query SELECT
    results = connector.execute_query("SELECT * FROM users ORDER BY id;")
    assert len(results) == 2
    assert results[0]["name"] == "Alice"
    assert results[1]["name"] == "Bob"

    # Test get_schema
    schema = connector.get_schema()
    assert "users" in schema

    # Test format_schema_for_llm
    formatted = format_schema_for_llm(schema)
    assert "Table: users" in formatted
    assert "Alice" not in formatted  # Schema should only contain structure, not rows

    connector.disconnect()
    print("✓ test_sqlite_connector_and_schema passed")


def test_factory_function():
    """Test database connector factory."""
    sqlite_conn = get_database_connector("sqlite", db_path=":memory:")
    assert isinstance(sqlite_conn, SQLiteConnector)

    pg_conn = get_database_connector("postgres")
    assert pg_conn is not None

    print("✓ test_factory_function passed")


def test_sql_safety_validator():
    """Test SQL safety validator against safe SELECT queries and unsafe DDL/DML."""
    # Safe queries
    assert validate_read_only("SELECT * FROM users;") is True
    assert validate_read_only("  WITH total AS (SELECT count(*) FROM sales) SELECT * FROM total; ") is True
    assert validate_read_only("SELECT name, age FROM users WHERE id = 1;") is True

    # Unsafe queries
    assert validate_read_only("DROP TABLE users;") is False
    assert validate_read_only("DELETE FROM users WHERE id = 1;") is False
    assert validate_read_only("INSERT INTO users VALUES ('Eve', 20);") is False
    assert validate_read_only("UPDATE users SET age = 31;") is False
    assert validate_read_only("TRUNCATE users;") is False

    # Sanitization
    assert sanitize_query("SELECT * FROM users;  ") == "SELECT * FROM users"
    print("✓ test_sql_safety_validator passed")


def test_serialization():
    """Test serialization of datetime and decimal types."""
    now = datetime.now()
    dec = Decimal("123.45")

    data = [{"created": now, "amount": dec, "name": "Test"}]
    serialized = serialize_results(data)

    assert isinstance(serialized[0]["created"], str)
    assert isinstance(serialized[0]["amount"], float)
    assert serialized[0]["amount"] == 123.45
    assert serialized[0]["name"] == "Test"
    print("✓ test_serialization passed")


if __name__ == "__main__":
    test_sqlite_connector_and_schema()
    test_factory_function()
    test_sql_safety_validator()
    test_serialization()
    print("\nAll database unit tests completed successfully!")
