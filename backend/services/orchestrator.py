import logging
import os
import re
from typing import Any, Dict

from agents.planner.agent import plan_user_request
from agents.sql_generator.agent import generate_sql
from database.queries import validate_read_only, sanitize_query, FORBIDDEN_PATTERN
from database.utils import serialize_results
from services.database_service import get_database, get_active_connection_info
from api.schemas import ExecutionPlan

logger = logging.getLogger(__name__)


def process_user_request(question: str) -> Dict[str, Any]:
    """
    Orchestrates planning, SQL generation, safety validation,
    and database query execution on the active user-connected database.
    """
    clean_q = question.strip()

    # 1. Verify active database connection
    db = get_database()
    conn_info = get_active_connection_info()

    if not db:
        return {
            "success": False,
            "message": "No database currently connected. Please connect your PostgreSQL or MySQL database, or upload a CSV file in the Connections page.",
            "user_query": question,
            "plan": None,
            "sql": None,
            "sql_explanation": None,
            "results": [],
            "columns": [],
            "rowCount": 0,
        }

    # 2. Check for destructive commands immediately
    forbidden_match = FORBIDDEN_PATTERN.search(clean_q)
    if forbidden_match:
        return {
            "success": False,
            "message": f"Query blocked: contains forbidden destructive keyword '{forbidden_match.group(0)}'. QPilot strictly enforces read-only operations.",
            "user_query": question,
            "plan": None,
            "sql": None,
            "sql_explanation": None,
            "results": [],
            "columns": [],
            "rowCount": 0,
        }

    # 3. Retrieve live database schema
    try:
        schema = db.get_schema()
    except Exception as e:
        logger.error(f"Failed to fetch schema: {e}")
        schema = {}

    conn_name = conn_info.get("name", "Connected Database")

    # 4. Check if the user entered a direct read-only SQL statement (SELECT or WITH)
    if validate_read_only(clean_q):
        clean_sql = sanitize_query(clean_q)
        try:
            raw_results = db.execute_query(clean_sql)
            results = serialize_results(raw_results)
            columns = list(results[0].keys()) if results else []

            plan = ExecutionPlan(
                task="direct_sql_query",
                question=question,
                steps=[
                    "Validate read-only AST safety",
                    f"Execute SQL on {conn_name}",
                    f"Returned {len(results)} rows",
                ],
            )
            return {
                "success": True,
                "message": f"Query executed successfully on {conn_name}.",
                "user_query": question,
                "plan": plan,
                "sql": clean_sql,
                "sql_explanation": f"Executed direct SQL query returning {len(results)} row(s).",
                "results": results,
                "columns": columns,
                "rowCount": len(results),
            }
        except Exception as err:
            return {
                "success": False,
                "message": f"Database execution error: {str(err)}",
                "user_query": question,
                "plan": None,
                "sql": clean_sql,
                "sql_explanation": None,
                "results": [],
                "columns": [],
                "rowCount": 0,
            }

    # 5. Check if query asks to explore a specific table
    table_match = re.search(r"from the (\w+) table", clean_q, re.IGNORECASE)
    matched_table = table_match.group(1).lower() if table_match else None
    if not matched_table:
        for tbl in schema.keys():
            if re.search(rf"\b{re.escape(tbl)}\b", clean_q, re.IGNORECASE):
                matched_table = tbl
                break

    # 6. Natural Language Processing (Groq LLM if configured)
    has_groq_key = bool(os.getenv("GROQ_API_KEY"))

    if has_groq_key:
        try:
            dialect = conn_info.get("type", "sqlite")
            plan = plan_user_request(question)
            sql_result = generate_sql(plan, schema, dialect=dialect)
            clean_sql = sanitize_query(sql_result.sql)

            if not validate_read_only(clean_sql):
                return {
                    "success": False,
                    "message": "Generated SQL failed read-only safety check.",
                    "user_query": question,
                    "plan": plan,
                    "sql": clean_sql,
                    "sql_explanation": sql_result.explanation,
                    "results": [],
                    "columns": [],
                    "rowCount": 0,
                }

            raw_results = db.execute_query(clean_sql)
            results = serialize_results(raw_results)
            columns = list(results[0].keys()) if results else []

            return {
                "success": True,
                "message": "Agentic query planned and executed successfully.",
                "user_query": question,
                "plan": plan,
                "sql": clean_sql,
                "sql_explanation": sql_result.explanation,
                "results": results,
                "columns": columns,
                "rowCount": len(results),
            }
        except Exception as e:
            logger.exception("Agentic pipeline execution failed.")
            return {
                "success": False,
                "message": f"Error running agent pipeline: {str(e)}",
                "user_query": question,
                "plan": None,
                "sql": None,
                "sql_explanation": None,
                "results": [],
                "columns": [],
                "rowCount": 0,
            }

    # 7. Fallback when GROQ_API_KEY is not configured
    if matched_table and matched_table in schema:
        # User asked about a specific table in their connected database
        clean_sql = f'SELECT * FROM "{matched_table}" LIMIT 25;'
        try:
            raw_results = db.execute_query(clean_sql)
            results = serialize_results(raw_results)
            columns = list(results[0].keys()) if results else []

            plan = ExecutionPlan(
                task=f"inspect_table_{matched_table}",
                question=question,
                steps=[
                    f"Identified table '{matched_table}' in schema",
                    "Constructed SELECT LIMIT 25 query",
                    f"Retrieved {len(results)} rows from {conn_name}",
                ],
            )
            return {
                "success": True,
                "message": f"Retrieved records from table '{matched_table}' in {conn_name}.",
                "user_query": question,
                "plan": plan,
                "sql": clean_sql,
                "sql_explanation": f"Retrieved sample records from table '{matched_table}'. Set GROQ_API_KEY in .env for full natural language analytical SQL generation.",
                "results": results,
                "columns": columns,
                "rowCount": len(results),
            }
        except Exception as err:
            return {
                "success": False,
                "message": f"Error querying table '{matched_table}': {str(err)}",
                "user_query": question,
                "plan": None,
                "sql": clean_sql,
                "sql_explanation": None,
                "results": [],
                "columns": [],
                "rowCount": 0,
            }

    # General fallback
    table_names = list(schema.keys())
    sample_table = table_names[0] if table_names else "your_table"
    return {
        "success": False,
        "message": (
            f"Connected to {conn_name} with tables: [{', '.join(table_names) if table_names else 'none'}]. "
            f"You can execute direct SQL queries (e.g. `SELECT * FROM \"{sample_table}\" LIMIT 10;`) "
            "or set `GROQ_API_KEY` in backend/.env for AI natural-language question translation."
        ),
        "user_query": question,
        "plan": None,
        "sql": None,
        "sql_explanation": None,
        "results": [],
        "columns": [],
        "rowCount": 0,
    }
