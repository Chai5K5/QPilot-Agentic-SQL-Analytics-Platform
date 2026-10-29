from agents.planner.agent import plan_user_request
from agents.sql_generator.agent import generate_sql
from database.queries import validate_read_only, sanitize_query
from services.database_service import get_database


def process_user_request(question: str):
    # 1. Get database
    db = get_database()

    # 2. Retrieve database schema
    schema = db.get_schema()

    # 3. Planner Agent
    plan = plan_user_request(question)

    # 4. SQL Generator Agent
    sql_result = generate_sql(plan, schema)

    # 5. Sanitize generated SQL
    clean_sql = sanitize_query(sql_result.sql)

    # 6. Validate SQL safety
    if not validate_read_only(clean_sql):
        return {
            "success": False,
            "message": "Generated SQL failed the read-only safety check.",
            "user_query": question,
            "plan": plan,
        }

    # 7. Execute SQL
    results = db.execute_query(clean_sql)

    return {
        "success": True,
        "message": "Query processed successfully.",
        "user_query": question,
        "plan": plan,
        "sql": clean_sql,
        "sql_explanation": sql_result.explanation,
        "results": results,
    }