from typing import Any, List, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ConnectionConfigRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl: Optional[bool] = None
    filePath: Optional[str] = None


class ListDatabasesRequest(BaseModel):
    type: str
    host: Optional[str] = "localhost"
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl: Optional[bool] = None
    database: Optional[str] = None


class ListDatabasesResponse(BaseModel):
    success: bool
    message: str
    databases: List[str] = []


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: float = 0.0
    table_count: int = 0


class TableColumnSchema(BaseModel):
    name: str
    type: str
    isPrimaryKey: bool = False
    nullable: bool = True
    defaultValue: Optional[Any] = None


class TableSchemaModel(BaseModel):
    name: str
    description: Optional[str] = None
    rowCountEstimate: Optional[int] = None
    columns: List[TableColumnSchema] = []


class ConnectionConnectResponse(BaseModel):
    success: bool
    message: str
    connection: Optional[dict] = None
    tables: List[TableSchemaModel] = []


class SchemaResponse(BaseModel):
    success: bool
    connection_name: Optional[str] = None
    tables: List[TableSchemaModel] = []


class QueryRequest(BaseModel):
    question: str


class ExecutionPlan(BaseModel):
    task: str
    question: str
    steps: List[str] = []


class QueryResponse(BaseModel):
    success: bool
    message: str
    user_query: str
    plan: Optional[ExecutionPlan] = None
    sql: Optional[str] = None
    sql_explanation: Optional[str] = None
    results: Optional[List[dict]] = None
    columns: Optional[List[str]] = None
    rowCount: Optional[int] = None


class SQLGenerationResult(BaseModel):
    sql: str
    explanation: str
