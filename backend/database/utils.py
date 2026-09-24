from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Dict, List
import uuid


def serialize_value(val: Any) -> Any:
    """
    Convert non-JSON-serializable data types (datetime, Decimal, UUID, bytes)
    into standard Python JSON-friendly primitive types.
    """
    if isinstance(val, (datetime, date, time)):
        return val.isoformat()
    elif isinstance(val, Decimal):
        return float(val) if val % 1 != 0 else int(val)
    elif isinstance(val, uuid.UUID):
        return str(val)
    elif isinstance(val, bytes):
        return val.decode("utf-8", errors="replace")
    return val


def serialize_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Serialize a list of database result dictionaries into JSON-safe dictionaries.
    """
    serialized = []
    for row in results:
        serialized_row = {col: serialize_value(val) for col, val in row.items()}
        serialized.append(serialized_row)
    return serialized


def format_schema_for_llm(schema: Dict[str, Any]) -> str:
    """
    Format a database schema dictionary into a readable DDL-like markdown string
    suitable for prompt injection into SQL generator agents.
    """
    if not schema:
        return "No schema available."

    output = []
    for table_name, table_info in schema.items():
        output.append(f"Table: {table_name}")
        output.append("Columns:")
        
        columns = table_info.get("columns", [])
        pks = table_info.get("primary_keys", [])
        
        for col in columns:
            col_name = col.get("column_name")
            data_type = col.get("data_type")
            is_nullable = col.get("is_nullable", "YES")
            
            pk_str = " [PRIMARY KEY]" if col_name in pks else ""
            null_str = " NULL" if is_nullable == "YES" else " NOT NULL"
            
            output.append(f"  - {col_name} ({data_type}){null_str}{pk_str}")
        
        output.append("")  # Empty line separator

    return "\n".join(output).strip()
