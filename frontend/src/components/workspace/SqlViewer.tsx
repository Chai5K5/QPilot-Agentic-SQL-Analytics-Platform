import React, { useState } from "react";
import { 
  Code2, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles
} from "lucide-react";

interface SqlViewerProps {
  sql: string;
  explanation: string;
  isValidatedReadOnly: boolean;
  validationError?: string;
}

export function SqlViewer({
  sql,
  explanation,
  isValidatedReadOnly,
  validationError,
}: SqlViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
      {/* Header bar */}
      <div className="px-4 py-3 bg-neutral-950/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Generated SQL Query</span>
          
          {isValidatedReadOnly ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Read-Only Validated
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-950/60 border border-rose-800/80 text-rose-300 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Execution Blocked (Destructive Statement)
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Copy SQL to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Copy SQL</span>
            </>
          )}
        </button>
      </div>

      {/* Blocked statement alert banner */}
      {!isValidatedReadOnly && validationError && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-900/60 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300">Safety Engine Enforcement:</div>
            <p className="mt-0.5">{validationError}</p>
            <p className="mt-1 text-[11px] text-rose-400 font-mono">
              Status: SQL execution was canceled. Database was NOT modified.
            </p>
          </div>
        </div>
      )}

      {/* SQL Code Block */}
      <div className="p-4 bg-neutral-950 overflow-x-auto">
        <pre className="font-mono text-xs sm:text-sm text-cyan-200/90 leading-relaxed whitespace-pre selection:bg-cyan-900 selection:text-white">
          {sql}
        </pre>
      </div>

      {/* Natural Language Query Explanation */}
      {explanation && (
        <div className="p-3.5 bg-neutral-900/80 border-t border-neutral-800 text-xs text-neutral-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-white mr-1.5">SQL Explanation:</span>
            <span className="text-neutral-400">{explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
