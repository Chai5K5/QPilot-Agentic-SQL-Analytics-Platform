import React, { useState } from "react";
import { 
  BookOpen, 
  Database, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  HelpCircle, 
  AlertTriangle,
  Cpu
} from "lucide-react";

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<
    "intro" | "connecting" | "prompting" | "safety" | "schema" | "troubleshooting"
  >("intro");

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            QPilot Documentation & Architecture Guide
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Complete reference for connecting data sources, writing effective analytical prompts, understanding AST safety enforcement, and backend agent mechanics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-1">
          {[
            { id: "intro", label: "Platform Architecture Overview", icon: Cpu },
            { id: "connecting", label: "Connecting Databases", icon: Database },
            { id: "prompting", label: "Effective Natural Prompting", icon: Terminal },
            { id: "safety", label: "AST Read-Only Safety Engine", icon: ShieldCheck },
            { id: "schema", label: "Schema Context & Inspection", icon: Layers },
            { id: "troubleshooting", label: "Errors & Recovery Guide", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  isActive
                    ? "bg-cyan-950/60 text-cyan-200 border border-cyan-800/80 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6 text-neutral-300 text-xs sm:text-sm leading-relaxed">
          {activeTab === "intro" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                QPilot Architecture & Backend Pipeline
              </h2>
              <p>
                QPilot is built around a decoupled agentic architecture. The browser client connects to a FastAPI service located in <code className="text-cyan-300">backend/main.py</code>.
              </p>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-semibold text-white">Execution Stages:</div>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-400">
                  <li>
                    <strong className="text-neutral-200">Planner Agent</strong> (<code className="text-cyan-300">backend/agents/planner/agent.py</code>): Interprets natural query intent, decomposes complex business metrics into structured analytical tasks.
                  </li>
                  <li>
                    <strong className="text-neutral-200">Orchestrator Service</strong> (<code className="text-cyan-300">backend/services/orchestrator.py</code>): Coordinates schema retrieval, dialect-specific query synthesis, and result binding.
                  </li>
                  <li>
                    <strong className="text-neutral-200">Read-Only Guard Engine</strong>: Inspects generated SQL statements to guarantee no data modifications occur.
                  </li>
                  <li>
                    <strong className="text-neutral-200">Database Connector</strong> (<code className="text-cyan-300">backend/database/connectors/postgres.py</code>): Executes validated read-only queries with strict timeouts.
                  </li>
                </ol>
              </div>

              <h3 className="text-base font-bold text-white pt-2">FastAPI Endpoints</h3>
              <div className="font-mono text-xs space-y-2">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-emerald-400">GET /health</span>
                  <span className="text-neutral-400">Returns service status, version, and backend heartbeat</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-cyan-400">POST /query</span>
                  <span className="text-neutral-400">Accepts natural question and triggers agent planner</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "connecting" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Connecting Databases
              </h2>
              <p>
                QPilot supports connecting to read replicas of relational databases. Browser code never connects directly to database servers; all database transactions are executed by the FastAPI server harness.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    PostgreSQL
                  </div>
                  <p className="text-xs text-neutral-400">
                    Host, port, database name, credentials, and SSL connection parameters. Mapped via <code className="text-cyan-300">psycopg</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    SQLite
                  </div>
                  <p className="text-xs text-neutral-400">
                    Direct local file system path for analytical sandboxes and embedded data warehouses.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-emerald-200 text-xs">
                <strong>Credential Protection:</strong> Database passwords are never exposed in user logs, URL queries, or model prompts.
              </div>
            </div>
          )}

          {activeTab === "prompting" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Writing Effective Natural Prompts
              </h2>
              <p>
                To obtain the most accurate SQL queries, include clear dimensional constraints, aggregation requirements, and target timeframe filters:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <div className="text-emerald-400 font-bold mb-1">Recommended Prompt:</div>
                  <p className="text-neutral-200">
                    "Which product categories generated the most revenue from completed orders in the last 6 months?"
                  </p>
                  <p className="text-neutral-500 text-[11px] mt-1">
                    Specifies table entity (product categories), metric (revenue), filter (completed orders), and timeframe (6 months).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <div className="text-amber-400 font-bold mb-1">Vague Prompt:</div>
                  <p className="text-neutral-200">
                    "Show sales."
                  </p>
                  <p className="text-neutral-500 text-[11px] mt-1">
                    Lacks grouping, granularity, or order status filters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "safety" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                AST Read-Only Safety Engine
              </h2>
              <p>
                The primary principle of QPilot is that analytical queries must never mutate database state. Every natural query and generated SQL statement is inspected by safety validators before dispatch.
              </p>

              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-2">
                <div className="font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Forbidden SQL Statements
                </div>
                <p className="text-xs text-neutral-300">
                  The following statements are immediately blocked with zero database execution:
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                  {["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "GRANT", "REVOKE"].map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-neutral-400 text-xs">
                When a query is blocked, QPilot generates an audit record marking the query as <strong className="text-rose-400">Blocked by Safety Guard</strong> and presents the exact rule that caught the violation.
              </p>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Schema Context & Inspection
              </h2>
              <p>
                QPilot inspects your connected database schema to construct grounded prompts for the SQL agent. This ensures generated queries reference valid table names, join keys, and data types.
              </p>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-bold text-white">Inspected Attributes:</div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-400">
                  <li>Table names and row estimates</li>
                  <li>Column identifiers and SQL data types (e.g. UUID, TIMESTAMP, NUMERIC)</li>
                  <li>Primary key constraints</li>
                  <li>Foreign key relationships (e.g. <code className="text-cyan-300">order_items.order_id → orders.id</code>)</li>
                  <li>Nullability constraints</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "troubleshooting" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                Common Issues & Troubleshooting
              </h2>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="font-bold text-white mb-1">Backend Connection Standby / Offline</div>
                  <p className="text-xs text-neutral-400">
                    If the header indicator shows "Backend: Standby", confirm that the FastAPI service is running:
                  </p>
                  <pre className="mt-2 p-2 rounded bg-neutral-900 text-cyan-300 font-mono text-xs">
                    cd backend && uvicorn main:app --reload --port 8000
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="font-bold text-white mb-1">Query Blocked by Safety Guard</div>
                  <p className="text-xs text-neutral-400">
                    If your question was blocked, ensure it asks for read-only aggregations and does not include modification keywords such as delete, clear, drop, or remove.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="font-bold text-white mb-1">0 Rows Returned</div>
                  <p className="text-xs text-neutral-400">
                    If a query succeeds but returns 0 rows, check whether filtering conditions (such as specific status values or dates) are too restrictive for the existing dataset.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
