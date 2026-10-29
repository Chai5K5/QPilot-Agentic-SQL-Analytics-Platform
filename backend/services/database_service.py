from pathlib import Path
from database.connectors.sqlite import SQLiteConnector

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEV_DB_PATH = BASE_DIR / "datasets" / "qpilot_dev.db"

if not DEV_DB_PATH.exists():
    DEV_DB_PATH = Path("../datasets/qpilot_dev.db")

DB_PATH = str(DEV_DB_PATH)


def get_database():
    """
    Returns the database connector used by QPilot.
    Development version uses the local SQLite database.
    """
    return SQLiteConnector(DB_PATH)
