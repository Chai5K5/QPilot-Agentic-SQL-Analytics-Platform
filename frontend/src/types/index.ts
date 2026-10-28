export type DatabaseType = "postgresql" | "sqlite" | "mysql";

export type ConnectionStatus = "connected" | "disconnected" | "testing" | "error";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  filePath?: string;
  status: ConnectionStatus;
  lastChecked?: string;
  isDefault?: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  nullable?: boolean;
  references?: string;
}

export interface TableSchema {
  name: string;
  description?: string;
  rowCountEstimate?: number;
  columns: ColumnInfo[];
}

export interface PlanStage {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail?: string;
}

export interface ExecutionPlan {
  task: string;
  question: string;
  stages: PlanStage[];
  rawMessage?: string;
}

export interface QueryExecutionResult {
  question: string;
  generatedSql: string;
  explanation: string;
  isReadOnlyValidated: boolean;
  validationError?: string;
  executionStatus: "success" | "blocked" | "error";
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  durationMs: number;
  timestamp: string;
  connectionId: string;
  connectionName: string;
  executionPlan: ExecutionPlan;
}

export interface QueryHistoryEntry {
  id: string;
  question: string;
  generatedSql: string;
  explanation?: string;
  status: "success" | "blocked" | "error";
  timestamp: string;
  durationMs: number;
  rowCount: number;
  connectionName: string;
  errorMessage?: string;
  isReadOnlyValidated: boolean;
  executionPlan?: ExecutionPlan;
  columns?: string[];
  rows?: Record<string, any>[];
}

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  reachable: boolean;
  error?: string;
}
