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
  BarChart3
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
    const prompt = `Show me summary metrics and key records from the ${tableName} table`;
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

      {/* 2. Schema Explorer Drawer */}
      <SchemaViewer
        schemas={schemas}
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        onSelectTableForQuery={handleSelectTableForQuery}
      />

      {/* 3. Natural Language Question Input Box */}
      <QueryInput
        onRunQuery={handleRunQuery}
        isLoading={isLoading}
        initialQuestion={currentQuestion}
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-white transition-colors"
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

          {/* Generated SQL & Safety Inspection */}
          <SqlViewer
            sql={lastResult.generatedSql}
            explanation={lastResult.explanation}
            isValidatedReadOnly={lastResult.isReadOnlyValidated}
            validationError={lastResult.validationError}
          />

          {/* Result Data & Visualizations (Only if read-only check passed) */}
          {lastResult.isReadOnlyValidated && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Query Analytics Output</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {lastResult.rowCount} rows returned
                  </span>
                </div>

                {/* View toggle (Table vs Chart) */}
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      viewMode === "table"
                        ? "bg-neutral-800 text-white font-medium"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Data Table
                  </button>
                  <button
                    onClick={() => setViewMode("chart")}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                      viewMode === "chart"
                        ? "bg-neutral-800 text-white font-medium"
                        : "text-neutral-400 hover:text-neutral-200"
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
