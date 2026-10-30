from fastapi import APIRouter, File, HTTPException, UploadFile
from api.schemas import (
    ConnectionConfigRequest,
    ConnectionConnectResponse,
    ConnectionTestResponse,
    HealthResponse,
    ListDatabasesRequest,
    ListDatabasesResponse,
    QueryRequest,
    QueryResponse,
    SchemaResponse,
    TableColumnSchema,
    TableSchemaModel,
)
from services.database_service import (
    connect_database,
    get_active_connection_info,
    get_active_schema,
    list_available_databases,
    load_csv,
    load_sqlite_file,
    test_connection_config,
)
from services.orchestrator import process_user_request
from services.query_service import get_health_status

router = APIRouter()


def format_schema_for_api(raw_schema: dict) -> list[TableSchemaModel]:
    """
    Transforms backend connector schema dictionary into frontend TableSchemaModel list.
    """
    tables = []
    for tbl_name, tbl_info in raw_schema.items():
        cols = []
        pks = set(tbl_info.get("primary_keys", []))
        for c in tbl_info.get("columns", []):
            col_name = c.get("column_name", "")
            cols.append(
                TableColumnSchema(
                    name=col_name,
                    type=c.get("data_type", "TEXT"),
                    isPrimaryKey=(col_name in pks),
                    nullable=(c.get("is_nullable", "YES") == "YES"),
                    defaultValue=c.get("column_default"),
                )
            )
        tables.append(
            TableSchemaModel(
                name=tbl_name,
                description=f"Table with {len(cols)} columns",
                columns=cols,
            )
        )
    return tables


@router.get("/")
def root():
    return {"message": "Welcome to QPilot API"}


@router.get("/health", response_model=HealthResponse)
def health_check():
    return get_health_status()


@router.post("/connections/list-databases", response_model=ListDatabasesResponse)
def list_databases_endpoint(request: ListDatabasesRequest):
    """
    Connect to a server (e.g. PostgreSQL or MySQL) and query all accessible databases
    so the user can choose from all databases available to them locally.
    """
    is_success, message, databases = list_available_databases(request.model_dump())
    return ListDatabasesResponse(
        success=is_success,
        message=message,
        databases=databases,
    )


@router.post("/connections/test", response_model=ConnectionTestResponse)
def test_connection_endpoint(request: ConnectionConfigRequest):
    """
    Test credentials for PostgreSQL, MySQL, or SQLite without making it active.
    """
    is_success, message, latency_ms, table_count = test_connection_config(request.model_dump())
    return ConnectionTestResponse(
        success=is_success,
        message=message,
        latency_ms=latency_ms,
        table_count=table_count,
    )


@router.post("/connections/connect", response_model=ConnectionConnectResponse)
def connect_endpoint(request: ConnectionConfigRequest):
    """
    Connect to a user database (PostgreSQL, MySQL, SQLite) and make it active.
    """
    is_success, message, conn_info, schema = connect_database(request.model_dump())
    if not is_success:
        raise HTTPException(status_code=400, detail=message)

    return ConnectionConnectResponse(
        success=True,
        message=message,
        connection=conn_info,
        tables=format_schema_for_api(schema),
    )


@router.post("/connections/upload", response_model=ConnectionConnectResponse)
async def upload_file_endpoint(file: UploadFile = File(...)):
    """
    Upload a CSV or SQLite file to analyze.
    """
    filename = file.filename or "uploaded_dataset"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if ext == "csv":
        is_success, message, conn_info, schema = load_csv(content, filename)
    elif ext in ("db", "sqlite", "sqlite3"):
        is_success, message, conn_info, schema = load_sqlite_file(content, filename)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats are .csv, .db, and .sqlite",
        )

    if not is_success:
        raise HTTPException(status_code=400, detail=message)

    return ConnectionConnectResponse(
        success=True,
        message=message,
        connection=conn_info,
        tables=format_schema_for_api(schema),
    )


@router.get("/connections/active")
def get_active_connection_endpoint():
    """
    Returns information about the currently active database connection.
    """
    return get_active_connection_info()


@router.get("/schema", response_model=SchemaResponse)
def get_schema_endpoint():
    """
    Returns the live schema for the active database.
    """
    schema = get_active_schema()
    conn_info = get_active_connection_info()
    return SchemaResponse(
        success=True,
        connection_name=conn_info.get("name"),
        tables=format_schema_for_api(schema),
    )


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """
    Execute natural language or SQL queries on the active database connection.
    """
    return process_user_request(request.question)
