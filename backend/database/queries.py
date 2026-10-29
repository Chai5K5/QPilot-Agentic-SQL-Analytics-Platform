import re
import logging

logger = logging.getLogger(__name__)

# List of SQL keywords that modify data or database structure (disallowed in read-only mode)
FORBIDDEN_KEYWORDS = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "GRANT",
    "REVOKE",
    "EXEC",
    "EXECUTE",
    "MERGE",
    "REPLACE",
]

# Regex pattern matching dangerous SQL statements as standalone tokens
FORBIDDEN_PATTERN = re.compile(
    r"\b(" + "|".join(FORBIDDEN_KEYWORDS) + r")\b",
    re.IGNORECASE
)


def validate_read_only(query: str) -> bool:
    """
    Validates if a SQL query is read-only (SELECT statements only).
    Returns True if safe, False if it contains forbidden DDL/DML keywords.
    """
    cleaned_query = query.strip()
    
    # Check if query starts with SELECT or WITH (CTE)
    if not (cleaned_query.upper().startswith("SELECT") or cleaned_query.upper().startswith("WITH")):
        logger.warning(f"Query blocked: Does not start with SELECT or WITH. Query snippet: {query[:50]}")
        return False

    # Check for forbidden keywords
    match = FORBIDDEN_PATTERN.search(cleaned_query)
    if match:
        logger.warning(f"Query blocked: Contains forbidden keyword '{match.group(0)}'. Query snippet: {query[:50]}")
        return False

    return True


def sanitize_query(query: str) -> str:
    """
    Sanitize and prepare a SQL query by trimming whitespace and trailing semicolons.
    """
    cleaned = query.strip()
    if cleaned.endswith(";"):
        cleaned = cleaned[:-1].strip()
    return cleaned
