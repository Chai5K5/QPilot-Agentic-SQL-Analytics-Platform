import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq

from database.utils import format_schema_for_llm
from api.schemas import ExecutionPlan, SQLGenerationResult

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

structured_llm = llm.with_structured_output(
    SQLGenerationResult,
    method="json_schema"
)


def generate_sql(
    plan: ExecutionPlan,
    schema: dict
) -> SQLGenerationResult:
    """
    Generates a read-only SQL query using the Planner's execution plan
    and the database schema.
    """
    formatted_schema = format_schema_for_llm(schema)
    prompt = f"""
You are the SQL Generator Agent for QPilot, an Agentic SQL Analytics Platform.

Your job is to convert the Planner Agent's execution plan into a valid SQL query.

Rules:
- Generate SQL only for the requested analytical task.
- Use ONLY tables and columns that exist in the provided schema.
- Do NOT invent table names or column names.
- Generate READ-ONLY SQL only.
- Use SELECT or WITH (CTE) statements.
- Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE,
  CREATE, GRANT, REVOKE, EXEC, EXECUTE, MERGE, or REPLACE.
- Do NOT execute the query.
- Return the SQL query and a short explanation.
- Follow the SQL dialect implied by the schema/database context.

Planner execution plan:
{plan.model_dump_json(indent=2)}

Database schema:
{formatted_schema}
"""

    return structured_llm.invoke(prompt)