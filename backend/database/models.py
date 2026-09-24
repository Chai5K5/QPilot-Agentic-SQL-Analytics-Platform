from datetime import datetime
try:
    from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, create_engine
    from sqlalchemy.orm import declarative_base, relationship
except ImportError:
    # Graceful fallback if sqlalchemy is imported before virtualenv environment check
    Column = Integer = String = Text = Float = DateTime = ForeignKey = create_engine = declarative_base = relationship = None

if declarative_base:
    Base = declarative_base()

    class DatabaseConnectionModel(Base):
        """
        Stores user-configured database connection profiles.
        """
        __tablename__ = "database_connections"

        id = Column(Integer, primary_key=True, index=True)
        name = Column(String(100), nullable=False)
        db_type = Column(String(50), nullable=False)  # 'postgres', 'sqlite', 'mysql'
        host = Column(String(255), nullable=True)
        port = Column(Integer, nullable=True)
        dbname = Column(String(255), nullable=True)
        user = Column(String(255), nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)

        query_logs = relationship("QueryLogModel", back_populates="connection")

    class QueryLogModel(Base):
        """
        Stores execution logs of user natural language queries and generated SQL statements.
        """
        __tablename__ = "query_logs"

        id = Column(Integer, primary_key=True, index=True)
        connection_id = Column(Integer, ForeignKey("database_connections.id"), nullable=True)
        user_question = Column(Text, nullable=False)
        generated_sql = Column(Text, nullable=True)
        execution_status = Column(String(50), default="pending")  # 'success', 'error', 'pending'
        row_count = Column(Integer, default=0)
        execution_time_ms = Column(Float, nullable=True)
        error_message = Column(Text, nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)

        connection = relationship("DatabaseConnectionModel", back_populates="query_logs")
else:
    Base = None
    DatabaseConnectionModel = None
    QueryLogModel = None
