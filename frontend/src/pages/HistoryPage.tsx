import React, { useState } from "react";
import { QueryHistoryEntry } from "@/types";
import { QueryDetailsModal } from "@/components/modals/QueryDetailsModal";
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  RotateCcw,
  Database
} from "lucide-react";

interface HistoryPageProps {
  history: QueryHistoryEntry[];
  onClearHistory: () => void;
  onReuseQuestion: (question: string) => void;
}

export function HistoryPage({
  history,
  onClearHistory,
  onReuseQuestion,
}: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "blocked" | "error">("all");
  const [selectedEntry, setSelectedEntry] = useState<QueryHistoryEntry | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.generatedSql.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.connectionName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Query Execution Audit Log
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Review past agentic planning executions, generated SQL statements, and safety audit logs.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/60 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search questions or SQL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-[11px] font-mono text-neutral-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(["all", "success", "blocked", "error"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                statusFilter === st
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
          <Database className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-300">No Query History Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "No queries match the active search and filter criteria."
              : "Ask questions in the Analytics Workspace to build an audit history of generated SQL and results."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.status === "success" && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                      <CheckCircle2 className="w-3 h-3" /> Read-Only Executed
                    </span>
                  )}
                  {item.status === "blocked" && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/80">
                      <AlertTriangle className="w-3 h-3" /> Blocked by Safety Guard
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                      <AlertTriangle className="w-3 h-3" /> Execution Error
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-neutral-400">
                    {item.connectionName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {item.durationMs} ms
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{item.rowCount} rows</span>
                </div>
              </div>

              {/* Natural question */}
              <div className="text-sm font-semibold text-white">
                "{item.question}"
              </div>

              {/* SQL snippet preview */}
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/90 font-mono text-xs text-cyan-300/90 overflow-x-auto whitespace-pre truncate">
                {item.generatedSql}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => setSelectedEntry(item)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Query & Plan Details</span>
                </button>

                <button
                  onClick={() => onReuseQuestion(item.question)}
                  className="flex items-center gap-1 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded-md transition-colors font-medium"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>Reuse in Workspace</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Query Details Modal */}
      <QueryDetailsModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onReuseQuestion={onReuseQuestion}
      />
    </div>
  );
}
