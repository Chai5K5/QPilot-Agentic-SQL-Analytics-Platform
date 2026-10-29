from database.connectors.sqlite import SQLiteConnector


DB_PATH = "../datasets/qpilot_dev.db"


def get_database():
    """
    Returns the database connector used by QPilot.
    Development version uses the local SQLite database.
    """
    return SQLiteConnector(DB_PATH)