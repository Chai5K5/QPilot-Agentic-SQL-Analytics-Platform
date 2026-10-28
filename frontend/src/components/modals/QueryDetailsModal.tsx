import React from "react";
import { QueryHistoryEntry } from "@/types";
import { 
  X, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Copy,
  Check
} from "lucide-react";

interface QueryDetailsModalProps {
  entry: QueryHistoryEntry | null;
  onClose: () => void;
  onReuseQuestion?: (q: string) => void;
}

export function QueryDetailsModal({
  entry,
  onClose,
  onReuseQuestion,
}: QueryDetailsModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!entry) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(entry.generatedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Query Execution Audit Record</h3>
              <p className="text-[11px] font-mono text-neutral-400">
                ID: {entry.id} • {entry.connectionName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status & Timing Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-2">
              {entry.status === "success" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Executed Successfully
                </span>
              )}
              {entry.status === "blocked" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Execution Blocked (Safety Rule)
                </span>
              )}
              {entry.status === "error" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Execution Error
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500" />
                {entry.durationMs} ms
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <span>•</span>
              <span>{entry.rowCount} rows</span>
            </div>
          </div>

          {/* Original Question */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              Natural Language Prompt:
            </span>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-medium">
              "{entry.question}"
            </div>
          </div>

          {/* Execution & Safety status statement */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              Read-Only Safety Inspection:
            </span>
            <div
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                entry.isReadOnlyValidated
                  ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-200"
                  : "bg-rose-950/40 border-rose-900/60 text-rose-200"
              }`}
            >
              {entry.isReadOnlyValidated ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">
                  {entry.isReadOnlyValidated ? "PASSED: " : "BLOCKED: "}
                </span>
                {entry.isReadOnlyValidated
                  ? "Dialect verified strictly read-only. No mutating expressions (INSERT/UPDATE/DELETE/DROP/ALTER) detected."
                  : entry.errorMessage || "Violated read-only security constraint. Query was NOT executed against database."}
              </div>
            </div>
          </div>

          {/* Generated SQL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                SQL Query Definition:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy SQL"}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-cyan-300 font-mono overflow-x-auto whitespace-pre">
              {entry.generatedSql}
            </pre>
          </div>

          {/* Explanation if present */}
          {entry.explanation && (
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Generated Query Explanation:
              </span>
              <p className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 leading-relaxed">
                {entry.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 font-mono">
            Safety Engine Audit Log
          </div>
          <div className="flex items-center gap-2">
            {onReuseQuestion && (
              <button
                onClick={() => {
                  onReuseQuestion(entry.question);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors"
              >
                Reuse Question in Workspace
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
