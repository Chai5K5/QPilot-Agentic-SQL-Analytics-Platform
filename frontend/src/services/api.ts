import {
  BackendHealth,
  DatabaseConnection,
  ExecutionPlan,
  PlanStage,
  QueryExecutionResult,
  TableSchema,
} from "@/types";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

// Safety check for read-only query compliance
export function validateReadOnlySQL(sqlOrQuestion: string): {
  isSafe: boolean;
  violation?: string;
} {
  const destructivePatterns = [
    { pattern: /\b(DROP)\b/i, name: "DROP table/schema/database" },
    { pattern: /\b(DELETE)\b/i, name: "DELETE records" },
    { pattern: /\b(UPDATE)\b/i, name: "UPDATE records" },
    { pattern: /\b(INSERT)\b/i, name: "INSERT records" },
    { pattern: /\b(TRUNCATE)\b/i, name: "TRUNCATE table" },
    { pattern: /\b(ALTER)\b/i, name: "ALTER table/schema" },
    { pattern: /\b(GRANT|REVOKE)\b/i, name: "GRANT/REVOKE permissions" },
    { pattern: /\b(CREATE)\b/i, name: "CREATE table/index" },
  ];

  for (const { pattern, name } of destructivePatterns) {
    if (pattern.test(sqlOrQuestion)) {
      return {
        isSafe: false,
        violation: `Query contains forbidden destructive statement (${name}). QPilot strictly enforces read-only operations to protect your data.`,
      };
    }
  }

  return { isSafe: true };
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${BACKEND_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "unhealthy",
        service: "QPilot Backend",
        version: "unknown",
        reachable: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      status: data.status || "healthy",
      service: data.service || "QPilot Backend",
      version: data.version || "1.0.0",
      reachable: true,
    };
  } catch (err: any) {
    return {
      status: "unreachable",
      service: "QPilot Backend (Offline)",
      version: "1.0.0",
      reachable: false,
      error:
        err.name === "AbortError"
          ? "Connection timed out"
          : "Backend server not responding at " + BACKEND_BASE_URL,
    };
  }
}

export async function listAvailableDatabases(
  creds: Partial<DatabaseConnection>
): Promise<{ success: boolean; message: string; databases: string[] }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${BACKEND_BASE_URL}/connections/list-databases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      databases: data.databases || [],
    };
  } catch (err: any) {
    return {
      success: false,
      message:
        err.name === "AbortError"
          ? "Database discovery request timed out."
          : err.message || "Failed to reach server.",
      databases: [],
    };
  }
}

export async function testDatabaseConnection(
  conn: Partial<DatabaseConnection>
): Promise<{ success: boolean; message: string; latency_ms?: number; table_count?: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${BACKEND_BASE_URL}/connections/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conn),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      latency_ms: data.latency_ms,
      table_count: data.table_count,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.name === "AbortError" ? "Connection test timed out." : err.message || "Failed to reach backend.",
    };
  }
}

export async function connectDatabase(
  conn: Partial<DatabaseConnection>
): Promise<{
  success: boolean;
  message: string;
  connection?: DatabaseConnection;
  tables: TableSchema[];
}> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/connections/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conn),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || "Failed to connect to database.",
        tables: [],
      };
    }

    return {
      success: true,
      message: data.message,
      connection: data.connection,
      tables: data.tables || [],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Connection request failed.",
      tables: [],
    };
  }
}

export async function uploadDatabaseFile(
  file: File
): Promise<{
  success: boolean;
  message: string;
  connection?: DatabaseConnection;
  tables: TableSchema[];
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BACKEND_BASE_URL}/connections/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || "File upload failed.",
        tables: [],
      };
    }

    return {
      success: true,
      message: data.message,
      connection: data.connection,
      tables: data.tables || [],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Upload request failed.",
      tables: [],
    };
  }
}

export async function fetchActiveSchema(): Promise<{
  success: boolean;
  connection_name?: string;
  tables: TableSchema[];
}> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/schema`);
    if (!response.ok) {
      return { success: false, tables: [] };
    }
    const data = await response.json();
    return {
      success: true,
      connection_name: data.connection_name,
      tables: data.tables || [],
    };
  } catch {
    return { success: false, tables: [] };
  }
}

export async function fetchActiveConnection(): Promise<DatabaseConnection | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/connections/active`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitQuestionToBackend(
  question: string,
  connectionName: string = "Connected Database"
): Promise<QueryExecutionResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  // Check read-only safety upfront
  const safetyCheck = validateReadOnlySQL(question);
  if (!safetyCheck.isSafe) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      question,
      generatedSql: `-- BLOCKED QUERY ATTEMPT\n-- Safety policy prevented execution:\n-- ${question}`,
      explanation:
        "Execution was halted by the QPilot Safety Engine. Destructive operations (DROP, DELETE, UPDATE, INSERT, ALTER) are forbidden in analytics mode.",
      isReadOnlyValidated: false,
      validationError: safetyCheck.violation,
      executionStatus: "blocked",
      columns: [],
      rows: [],
      rowCount: 0,
      durationMs,
      timestamp,
      connectionId: "conn-active",
      connectionName,
      executionPlan: {
        task: "analyze_sql",
        question,
        rawMessage: "Safety violation detected",
        stages: [
          {
            id: "1",
            label: "Question Intent Analysis",
            status: "completed",
            detail: "Detected data modification intent",
          },
          {
            id: "2",
            label: "SQL Generator",
            status: "skipped",
            detail: "Aborted due to safety policy",
          },
          {
            id: "3",
            label: "AST Read-Only Validator",
            status: "failed",
            detail: safetyCheck.violation,
          },
          {
            id: "4",
            label: "Database Execution",
            status: "skipped",
            detail: "Query not executed",
          },
          {
            id: "5",
            label: "Result Aggregation",
            status: "skipped",
            detail: "No results generated",
          },
        ],
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${BACKEND_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    if (!response.ok) {
      const errText = await response.text();
      return {
        question,
        generatedSql: `-- Backend HTTP Error ${response.status}: ${response.statusText}`,
        explanation: `Backend request failed: ${errText || response.statusText}`,
        isReadOnlyValidated: false,
        validationError: `HTTP ${response.status}: ${response.statusText}`,
        executionStatus: "error",
        columns: [],
        rows: [],
        rowCount: 0,
        durationMs,
        timestamp,
        connectionId: "conn-active",
        connectionName,
        executionPlan: {
          task: "query_execution",
          question,
          rawMessage: `HTTP ${response.status}`,
          stages: [
            {
              id: "1",
              label: "Backend Request",
              status: "failed",
              detail: `HTTP ${response.status}: ${response.statusText}`,
            },
          ],
        },
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        question,
        generatedSql: data.sql || `-- Query failed\n-- ${data.message}`,
        explanation: data.message || "Query execution failed.",
        isReadOnlyValidated: false,
        validationError: data.message,
        executionStatus: "error",
        columns: [],
        rows: [],
        rowCount: 0,
        durationMs,
        timestamp,
        connectionId: "conn-active",
        connectionName,
        executionPlan: {
          task: data.plan?.task || "query_execution",
          question,
          rawMessage: data.message,
          stages: [
            {
              id: "1",
              label: "Safety / Execution Check",
              status: "failed",
              detail: data.message,
            },
          ],
        },
      };
    }

    // Success: Extract actual data from database execution response
    const rows: Record<string, any>[] = data.results || [];
    const columns: string[] =
      data.columns && data.columns.length > 0
        ? data.columns
        : rows.length > 0
        ? Object.keys(rows[0])
        : [];

    const planStages: PlanStage[] =
      data.plan?.steps && data.plan.steps.length > 0
        ? data.plan.steps.map((stepText: string, i: number) => ({
            id: String(i + 1),
            label: stepText,
            status: "completed" as const,
            detail: "Executed successfully",
          }))
        : [
            {
              id: "1",
              label: "Question Intent Analysis",
              status: "completed",
              detail: "Parsed analytical query",
            },
            {
              id: "2",
              label: "SQL Generator",
              status: "completed",
              detail: "Generated SQL statement",
            },
            {
              id: "3",
              label: "AST Read-Only Validator",
              status: "completed",
              detail: "Passed: Read-only safe",
            },
            {
              id: "4",
              label: "Database Execution",
              status: "completed",
              detail: `Executed on ${connectionName}`,
            },
            {
              id: "5",
              label: "Result Aggregation",
              status: "completed",
              detail: `Retrieved ${rows.length} rows`,
            },
          ];

    return {
      question,
      generatedSql: data.sql || `-- Executed query for: ${question}`,
      explanation:
        data.sql_explanation ||
        data.message ||
        `Query returned ${rows.length} rows from database.`,
      isReadOnlyValidated: true,
      executionStatus: "success",
      columns,
      rows,
      rowCount: data.rowCount ?? rows.length,
      durationMs,
      timestamp,
      connectionId: "conn-active",
      connectionName,
      executionPlan: {
        task: data.plan?.task || "analyze_sql",
        question,
        rawMessage: data.message,
        stages: planStages,
      },
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      question,
      generatedSql: `-- Could not connect to backend at ${BACKEND_BASE_URL}`,
      explanation: `Backend connection error: ${
        err.name === "AbortError" ? "Request timed out" : err.message
      }. Please make sure the backend FastAPI server is running at ${BACKEND_BASE_URL}.`,
      isReadOnlyValidated: false,
      validationError: err.message,
      executionStatus: "error",
      columns: [],
      rows: [],
      rowCount: 0,
      durationMs,
      timestamp,
      connectionId: "conn-active",
      connectionName,
      executionPlan: {
        task: "connect_backend",
        question,
        rawMessage: err.message,
        stages: [
          {
            id: "1",
            label: "Backend Connection",
            status: "failed",
            detail: `Cannot reach backend at ${BACKEND_BASE_URL}`,
          },
        ],
      },
    };
  }
}
