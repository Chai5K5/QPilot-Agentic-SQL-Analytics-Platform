import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq

from database.utils import format_schema_for_llm
from api.schemas import ExecutionPlan, SQLGenerationResult

load_dotenv()

api_key = os.getenv("GROQ_API_KEY") or "gsk_placeholder"

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=api_key,
    temperature=0
)

structured_llm = llm.with_structured_output(
    SQLGenerationResult,
    method="json_schema"
)


def generate_sql(
    plan: ExecutionPlan,
    schema: dict,
    dialect: str = "sqlite"
) -> SQLGenerationResult:
    """
    Generates a read-only SQL query using the Planner's execution plan
    and the database schema for the specified dialect.
    """
    formatted_schema = format_schema_for_llm(schema)
    available_tables = list(schema.keys())

    dialect_guidance = ""
    if dialect in ("sqlite", "csv"):
        dialect_guidance = """
- Database dialect: SQLite.
- Do NOT use `information_schema`. In SQLite, to inspect or list tables, use:
  SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
- String functions: Use || for concatenation, SUBSTR() instead of SUBSTRING().
- Use standard SQLite datetime and aggregation functions.
"""
    elif dialect == "postgresql":
        dialect_guidance = """
- Database dialect: PostgreSQL.
- You can query `information_schema` or pg_catalog if needed.
- Double-quote table/column names if they contain special characters or mixed case.
"""
    elif dialect == "mysql":
        dialect_guidance = """
- Database dialect: MySQL.
- Backtick table/column names if needed.
"""

    prompt = f"""
You are the SQL Generator Agent for QPilot, an Agentic SQL Analytics Platform.

Your job is to convert the Planner Agent's execution plan into a valid SQL query.

Target SQL Dialect: {dialect.upper()}
{dialect_guidance}

Available tables in this database:
{', '.join(available_tables) if available_tables else 'None loaded yet'}

Rules:
- Generate SQL only for the requested analytical task.
- Use ONLY tables and columns that exist in the provided schema whenever possible.
- Do NOT invent table names or column names.
- Generate READ-ONLY SQL only.
- Use SELECT or WITH (CTE) statements.
- Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE,
  CREATE, GRANT, REVOKE, EXEC, EXECUTE, MERGE, or REPLACE.
- Do NOT execute the query.
- Return the SQL query and a short explanation.

Planner execution plan:
{plan.model_dump_json(indent=2)}

Database schema:
{formatted_schema}
"""

    return structured_llm.invoke(prompt)
