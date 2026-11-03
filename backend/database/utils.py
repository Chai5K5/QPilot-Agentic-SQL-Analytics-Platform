import json
from decimal import Decimal
from datetime import date, datetime
from typing import Any, Dict, List


def serialize_value(val: Any) -> Any:
    """
    Serializes a single database cell into a JSON-compatible type.
    """
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    elif isinstance(val, Decimal):
        return float(val)
    elif isinstance(val, bytes):
        return val.decode("utf-8", errors="replace")
    elif isinstance(val, set):
        return list(val)
    return val


def serialize_results(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Serialize database query results into JSON-compatible Python primitives.
    Handles date, datetime, Decimal, bytes, and sets.
    """
    serialized = []
    for row in rows:
        serialized_row = {key: serialize_value(val) for key, val in row.items()}
        serialized.append(serialized_row)
    return serialized


def format_schema_for_llm(schema: Dict[str, Any]) -> str:
    """
    Format a database schema dictionary into a readable DDL-like markdown string
    suitable for prompt injection into SQL generator agents.
    Robustly handles dictionaries, lists, or custom schemas.
    """
    if not schema:
        return "No schema available."

    output = []
    for table_name, table_info in schema.items():
        output.append(f"Table: {table_name}")
        output.append("Columns:")
        
        if isinstance(table_info, dict):
            columns = table_info.get("columns", [])
            pks = table_info.get("primary_keys", [])
        elif isinstance(table_info, list):
            columns = table_info
            pks = []
        else:
            columns = []
            pks = []
        
        for col in columns:
            if isinstance(col, dict):
                col_name = col.get("column_name") or col.get("name") or str(col)
                data_type = col.get("data_type") or col.get("type") or "TEXT"
                is_nullable = col.get("is_nullable", "YES")
                is_pk = col.get("isPrimaryKey") or (col_name in pks)
            else:
                col_name = str(col)
                data_type = "TEXT"
                is_nullable = "YES"
                is_pk = False
            
            pk_str = " [PRIMARY KEY]" if is_pk else ""
            null_str = " NULL" if is_nullable in ("YES", True) else " NOT NULL"
            
            output.append(f"  - {col_name} ({data_type}){null_str}{pk_str}")
        
        output.append("")  # Empty line separator

    return "\n".join(output)
