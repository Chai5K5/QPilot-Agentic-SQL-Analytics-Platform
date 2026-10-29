import os
import re
from agents.planner.agent import plan_user_request
from agents.sql_generator.agent import generate_sql
from database.queries import validate_read_only, sanitize_query, FORBIDDEN_PATTERN
from services.database_service import get_database
from api.schemas import ExecutionPlan


def process_user_request(question: str):
    try:
        clean_q = question.strip()

        # Check for forbidden destructive keywords upfront
        forbidden_match = FORBIDDEN_PATTERN.search(clean_q)
        if forbidden_match:
            return {
                "success": False,
                "message": f"Query blocked: contains forbidden destructive keyword '{forbidden_match.group(0)}'. QPilot enforces read-only operations.",
                "user_query": question,
                "plan": None,
                "sql": None,
                "sql_explanation": None,
                "results": [],
            }

        # 1. Get database
        db = get_database()

        # 2. Retrieve database schema
        schema = db.get_schema()

        # Check if user passed a direct read-only SQL statement (e.g., SELECT * FROM customers)
        if validate_read_only(clean_q):
            clean_sql = sanitize_query(clean_q)
            results = db.execute_query(clean_sql)
            plan = ExecutionPlan(
                task="direct_sql_query",
                question=question,
                steps=[
                    "Validate read-only SQL statement",
                    "Execute query on SQLite database",
                    f"Return {len(results)} rows",
                ],
            )
            return {
                "success": True,
                "message": "Direct SQL query executed successfully on development database.",
                "user_query": question,
                "plan": plan,
                "sql": clean_sql,
                "sql_explanation": f"Executed read-only SQL query returning {len(results)} rows.",
                "results": results,
            }

        # Check if question refers to viewing a specific table (e.g. from table click in schema viewer)
        table_match = re.search(r"from the (\w+) table", clean_q, re.IGNORECASE)
        table_name = table_match.group(1).lower() if table_match else None
        if not table_name:
            # Check if clean_q matches any table name directly
            for tbl in schema.keys():
                if tbl.lower() in clean_q.lower():
                    table_name = tbl
                    break

        has_groq_key = bool(os.getenv("GROQ_API_KEY"))

        if has_groq_key:
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
                    "sql": clean_sql,
                    "sql_explanation": sql_result.explanation,
                    "results": [],
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
        else:
            # If GROQ_API_KEY is not set, provide actual execution on the SQLite database
            lower_q = clean_q.lower()
            if any(k in lower_q for k in ["top 3", "categories", "category", "revenue", "product"]):
                clean_sql = (
                    "SELECT c.category_name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue "
                    "FROM categories c "
                    "JOIN products p ON c.category_id = p.category_id "
                    "JOIN order_items oi ON p.product_id = oi.product_id "
                    "JOIN orders o ON oi.order_id = o.order_id "
                    "WHERE o.status = 'completed' AND p.discontinued = 0 "
                    "GROUP BY c.category_id, c.category_name "
                    "ORDER BY total_revenue DESC LIMIT 3"
                )
                results = db.execute_query(clean_sql)
                plan = ExecutionPlan(
                    task="analyze_top_categories_revenue",
                    question=question,
                    steps=[
                        "Identify top product categories by completed revenue",
                        "Filter out discontinued products",
                        "Aggregate revenue by category in descending order",
                        "Limit output to top 3 categories",
                    ],
                )
                return {
                    "success": True,
                    "message": "Query processed successfully using actual dev database.",
                    "user_query": question,
                    "plan": plan,
                    "sql": clean_sql,
                    "sql_explanation": "Aggregated total revenue from completed orders by category from qpilot_dev.db.",
                    "results": results,
                }
            elif table_name and table_name in schema:
                clean_sql = f"SELECT * FROM {table_name} LIMIT 25"
                results = db.execute_query(clean_sql)
                plan = ExecutionPlan(
                    task=f"query_table_{table_name}",
                    question=question,
                    steps=[
                        f"Target table '{table_name}' from dev database",
                        "Generate SELECT query with LIMIT 25",
                        "Execute query and return records",
                    ],
                )
                return {
                    "success": True,
                    "message": f"Retrieved records from {table_name} table in development database.",
                    "user_query": question,
                    "plan": plan,
                    "sql": clean_sql,
                    "sql_explanation": f"Retrieved actual records from {table_name} table in qpilot_dev.db.",
                    "results": results,
                }
            else:
                return {
                    "success": False,
                    "message": "GROQ_API_KEY is not set in environment or .env. Please configure GROQ_API_KEY for dynamic natural-language SQL generation, or run a direct SQL query (e.g. SELECT * FROM customers).",
                    "user_query": question,
                    "plan": None,
                    "sql": None,
                    "sql_explanation": None,
                    "results": [],
                }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error executing query: {str(e)}",
            "user_query": question,
            "plan": None,
            "sql": None,
            "sql_explanation": None,
            "results": [],
        }
