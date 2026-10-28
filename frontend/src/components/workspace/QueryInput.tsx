import React, { useState } from "react";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  AlertCircle
} from "lucide-react";

interface QueryInputProps {
  onRunQuery: (question: string) => void;
  isLoading: boolean;
  initialQuestion?: string;
}

const EXAMPLE_QUESTIONS = [
  "Which product categories generated the most revenue from completed orders?",
  "Show top enterprise customers by completed orders and lifetime value",
  "Calculate monthly transaction counts and gross volume for the last 6 months",
  "Summarize analytics execution jobs grouped by status and average duration",
  "DROP TABLE customers CASCADE;", // Safety test prompt
];

export function QueryInput({
  onRunQuery,
  isLoading,
  initialQuestion = "",
}: QueryInputProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError("Please enter a question about your database.");
      return;
    }
    setValidationError(null);
    onRunQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <label 
            htmlFor="natural-query-input"
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Ask QPilot in Natural Language</span>
          </label>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AST Read-Only Guard Active</span>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            id="natural-query-input"
            rows={3}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="e.g. Which product categories generated the highest revenue in Q3, and what was their average order value?"
            className={`w-full p-4 rounded-xl text-sm bg-neutral-950 text-white placeholder-neutral-500 border transition-all resize-none font-sans focus:outline-none focus:ring-2 ${
              validationError
                ? "border-rose-500 focus:ring-rose-500/20"
                : "border-neutral-700/80 focus:border-cyan-500 focus:ring-cyan-500/20"
            } disabled:opacity-50`}
          />

          {/* Character / Shortcut hint */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] font-mono text-neutral-500 pointer-events-none hidden sm:flex">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">
              Enter
            </kbd>
          </div>
        </div>

        {/* Empty / Error validation warning */}
        {validationError && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action bar and interactive prompt chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Example prompt pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] font-mono text-neutral-500 mr-1 flex-shrink-0">
              Examples:
            </span>
            {EXAMPLE_QUESTIONS.map((ex, idx) => {
              const isDestructive = ex.includes("DROP");
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(ex);
                    if (validationError) setValidationError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                    isDestructive
                      ? "bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/40"
                      : "bg-neutral-800/80 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700"
                  }`}
                  title={isDestructive ? "Test Read-Only AST Validation Blocker" : "Load sample question"}
                >
                  {isDestructive ? "⚠️ Test Safety Guard (DROP)" : ex.slice(0, 36) + "..."}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Planning & Executing...</span>
              </>
            ) : (
              <>
                <span>Run Agentic Query</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
