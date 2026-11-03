import React, { useState } from "react";
import { 
  DatabaseConnection, 
  TableSchema, 
  QueryExecutionResult, 
  QueryHistoryEntry 
} from "@/types";
import { ConnectionBar } from "@/components/workspace/ConnectionBar";
import { SchemaViewer } from "@/components/workspace/SchemaViewer";
import { QueryInput } from "@/components/workspace/QueryInput";
import { ExecutionPlanView } from "@/components/workspace/ExecutionPlanView";
import { SqlViewer } from "@/components/workspace/SqlViewer";
import { ResultsTable } from "@/components/workspace/ResultsTable";
import { ResultsChart } from "@/components/workspace/ResultsChart";
import { submitQuestionToBackend } from "@/services/api";
import { 
  AlertTriangle, 
  RotateCcw, 
  BarChart3,
  Database
} from "lucide-react";

interface WorkspacePageProps {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection;
  onSelectConnection: (conn: DatabaseConnection) => void;
  schemas: TableSchema[];
  onOpenConnections: () => void;
  onSaveHistory: (entry: QueryHistoryEntry) => void;
  initialQuestion?: string;
}

export function WorkspacePage({
  connections,
  activeConnection,
  onSelectConnection,
  schemas,
  onOpenConnections,
  onSaveHistory,
  initialQuestion = "",
}: WorkspacePageProps) {
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const handleRunQuery = async (question: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentQuestion(question);

    try {
      const result = await submitQuestionToBackend(question, activeConnection.name);
      setLastResult(result);

      // Save to query history
      const historyEntry: QueryHistoryEntry = {
        id: `hist-${Date.now()}`,
        question: result.question,
        generatedSql: result.generatedSql,
        explanation: result.explanation,
        status: result.executionStatus,
        timestamp: result.timestamp,
        durationMs: result.durationMs,
        rowCount: result.rowCount,
        connectionName: result.connectionName,
        errorMessage: result.validationError,
        isReadOnlyValidated: result.isReadOnlyValidated,
        executionPlan: result.executionPlan,
        columns: result.columns,
        rows: result.rows,
      };

      onSaveHistory(historyEntry);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while communicating with the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTableForQuery = (tableName: string) => {
    const prompt = `SELECT * FROM "${tableName}" LIMIT 25;`;
    setCurrentQuestion(prompt);
    setIsSchemaOpen(false);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6 max-w-7xl">
      {/* 1. Connection Bar with Status and Schema Toggle */}
      <ConnectionBar
        connections={connections}
        activeConnection={activeConnection}
        onSelectConnection={onSelectConnection}
        onToggleSchema={() => setIsSchemaOpen(!isSchemaOpen)}
        isSchemaOpen={isSchemaOpen}
        onManageConnections={onOpenConnections}
        tableCount={schemas.length}
      />

      {/* Zero State Notice */}
      {schemas.length === 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">No database or dataset connected</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Connect your PostgreSQL or MySQL database, or upload a CSV file to inspect schema and query data.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenConnections}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer flex-shrink-0"
          >
            Connect Database / Upload CSV
          </button>
        </div>
      )}

      {/* 2. Schema Explorer Drawer */}
      <SchemaViewer
        schemas={schemas}
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        onSelectTableForQuery={handleSelectTableForQuery}
      />

      {/* 3. Question / SQL Input Box */}
      <QueryInput
        onRunQuery={handleRunQuery}
        isLoading={isLoading}
        initialQuestion={currentQuestion}
        schemas={schemas}
      />

      {/* 4. Global Error Alert if request failed */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 flex items-start justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Backend Communication Issue:</span>
              <p className="mt-0.5 text-neutral-300">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => handleRunQuery(currentQuestion)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* 5. Query Results Area */}
      {lastResult && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Agentic Execution Plan */}
          <ExecutionPlanView
            plan={lastResult.executionPlan}
            durationMs={lastResult.durationMs}
          />

          {/* Generated Read-Only SQL Viewer */}
          <SqlViewer
            sql={lastResult.generatedSql}
            isValidatedReadOnly={lastResult.isReadOnlyValidated}
            validationError={lastResult.validationError}
            explanation={lastResult.explanation}
          />

          {/* Result Dataset with Toggle for Table / Chart */}
          {lastResult.executionStatus === "success" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Query Output
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">
                    ({lastResult.rowCount} rows returned in {lastResult.durationMs}ms)
                  </span>
                </div>

                {/* View switcher buttons */}
                <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === "table"
                        ? "bg-neutral-800 text-cyan-300 font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setViewMode("chart")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      viewMode === "chart"
                        ? "bg-neutral-800 text-cyan-300 font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Visual Chart</span>
                  </button>
                </div>
              </div>

              {viewMode === "table" ? (
                <ResultsTable
                  columns={lastResult.columns}
                  rows={lastResult.rows}
                  rowCount={lastResult.rowCount}
                />
              ) : (
                <ResultsChart
                  columns={lastResult.columns}
                  rows={lastResult.rows}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
