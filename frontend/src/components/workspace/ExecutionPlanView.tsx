import React from "react";
import { ExecutionPlan } from "@/types";
import { 
  Bot, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Server
} from "lucide-react";

interface ExecutionPlanViewProps {
  plan: ExecutionPlan;
  durationMs: number;
}

export function ExecutionPlanView({
  plan,
  durationMs,
}: ExecutionPlanViewProps) {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-white">
              Agentic Orchestrator Plan
            </span>
            <span className="text-[10px] font-mono text-cyan-400 ml-2">
              task: {plan.task}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>{durationMs} ms total</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-800 text-cyan-300">
            <Server className="w-3 h-3" />
            <span>FastAPI: {plan.rawMessage || "Planner Agent"}</span>
          </div>
        </div>
      </div>

      {/* Plan Pipeline Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3">
        {plan.stages.map((stage, idx) => {
          let statusBadge;
          if (stage.status === "completed") {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            );
          } else if (stage.status === "failed") {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                <AlertCircle className="w-3 h-3" /> Blocked
              </span>
            );
          } else if (stage.status === "skipped") {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                Skipped
              </span>
            );
          } else {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 animate-pulse">
                Running...
              </span>
            );
          }

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                stage.status === "completed"
                  ? "bg-neutral-950/80 border-neutral-800"
                  : stage.status === "failed"
                  ? "bg-rose-950/30 border-rose-900/60"
                  : "bg-neutral-950/40 border-neutral-800/60 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-neutral-500">
                    0{idx + 1}
                  </span>
                  {statusBadge}
                </div>
                <div className="font-semibold text-neutral-200 text-xs tracking-tight">
                  {stage.label}
                </div>
              </div>
              {stage.detail && (
                <div className="text-[10px] text-neutral-400 mt-1 font-mono truncate" title={stage.detail}>
                  {stage.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
