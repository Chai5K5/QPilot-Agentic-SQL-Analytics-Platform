from database.connectors.sqlite import SQLiteConnector
from database.queries import validate_read_only, sanitize_query
from agents.planner.agent import plan_user_request
from agents.sql_generator.agent import generate_sql


DB_PATH = "../datasets/qpilot_dev.db"

QUESTION = (
    "Which are the top 3 product categories by total revenue "
    "from completed orders, excluding discontinued products?"
)


def main():
    print("=" * 70)
    print("QPilot Agent Test")
    print("=" * 70)

    print(f"\nQuestion:\n{QUESTION}")

    # ---------------------------------------------------------
    # 1. Database schema
    # ---------------------------------------------------------
    db = SQLiteConnector(DB_PATH)
    schema = db.get_schema()

    print("\n[1] Database schema retrieved successfully.")

    # ---------------------------------------------------------
    # 2. Planner Agent
    # ---------------------------------------------------------
    plan = plan_user_request(QUESTION)

    print("\n[2] Planner Agent")
    print("-" * 70)
    print(plan.model_dump())

    # ---------------------------------------------------------
    # 3. SQL Generator Agent
    # ---------------------------------------------------------
    result = generate_sql(plan, schema)

    print("\n[3] SQL Generator Agent")
    print("-" * 70)
    print(f"SQL:\n{result.sql}")
    print(f"\nExplanation:\n{result.explanation}")

    # ---------------------------------------------------------
    # 4. SQL Safety Validation
    # ---------------------------------------------------------
    clean_sql = sanitize_query(result.sql)
    is_safe = validate_read_only(clean_sql)

    print("\n[4] SQL Safety Validation")
    print("-" * 70)
    print(f"Read-only query: {is_safe}")

    if not is_safe:
        print("ERROR: Generated SQL failed the read-only safety check.")
        return

    # ---------------------------------------------------------
    # 5. Database Execution
    # ---------------------------------------------------------
    print("\n[5] Database Execution")
    print("-" * 70)

    try:
        results = db.execute_query(clean_sql)

        print(f"Rows returned: {len(results)}")

        for row in results:
            print(row)

    except Exception as error:
        print("ERROR: SQL execution failed.")
        print(error)
        return

    print("\n" + "=" * 70)
    print("Test completed successfully.")
    print("=" * 70)


if __name__ == "__main__":
    main()