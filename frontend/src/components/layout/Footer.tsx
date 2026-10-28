import React from "react";
import { Terminal, ShieldCheck } from "lucide-react";

interface FooterProps {
  setActivePage: (page: "landing" | "workspace" | "connections" | "history" | "docs") => void;
}

export function Footer({ setActivePage }: FooterProps) {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 text-neutral-400 py-12 px-4 md:px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand column */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">QPilot</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Agentic natural-language SQL intelligence. Translate complex questions into verified, read-only queries with full transparency.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Read-Only Safety Engine</span>
          </div>
        </div>

        {/* Navigation column */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">
            Platform Pages
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={() => setActivePage("landing")}
                className="hover:text-cyan-400 transition-colors"
              >
                Product Overview
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActivePage("workspace")}
                className="hover:text-cyan-400 transition-colors"
              >
                Analytics Workspace
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActivePage("connections")}
                className="hover:text-cyan-400 transition-colors"
              >
                Database Connections
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActivePage("history")}
                className="hover:text-cyan-400 transition-colors"
              >
                Query Audit & History
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActivePage("docs")}
                className="hover:text-cyan-400 transition-colors"
              >
                Documentation & Architecture
              </button>
            </li>
          </ul>
        </div>

        {/* Database Support & Safety column */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">
            Dialects & Safety
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PostgreSQL (Active Connector)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>SQLite (Connector in Progress)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              <span>MySQL (Planned Connector)</span>
            </li>
            <li className="pt-1 text-neutral-500">
              Strict AST validation prevents <code className="text-rose-400">DROP</code>, <code className="text-rose-400">DELETE</code>, and <code className="text-rose-400">UPDATE</code>.
            </li>
          </ul>
        </div>

        {/* Architecture & Stack info */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">
            Architecture
          </h4>
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-400">Backend:</span>
              <span className="text-neutral-200">FastAPI / Python</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Planner:</span>
              <span className="text-cyan-300">Agentic Orchestrator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Frontend:</span>
              <span className="text-neutral-200">React 19 + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Branch:</span>
              <span className="text-amber-400">frontend</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
        <div>
          © {new Date().getFullYear()} QPilot Agentic SQL Analytics Platform. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-neutral-300 cursor-pointer" onClick={() => setActivePage("docs")}>
            Architecture Spec
          </span>
          <span>•</span>
          <span className="hover:text-neutral-300 cursor-pointer" onClick={() => setActivePage("docs")}>
            Read-Only Policy
          </span>
          <span>•</span>
          <span className="hover:text-neutral-300 cursor-pointer" onClick={() => setActivePage("connections")}>
            Connection Security
          </span>
        </div>
      </div>
    </footer>
  );
}
