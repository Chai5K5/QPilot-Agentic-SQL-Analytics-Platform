import React from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { 
  Database, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  Cpu,
  Zap
} from "lucide-react";

interface LandingPageProps {
  onOpenWorkspace: () => void;
  onOpenConnections: () => void;
  onOpenDocs: () => void;
}

export function LandingPage({
  onOpenWorkspace,
  onOpenConnections,
  onOpenDocs,
}: LandingPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Hero Section with Flowing SQL Queries */}
      <BackgroundPaths
        title="QPilot Agentic SQL Analytics"
        subtitle="Translate natural language questions into safe, optimized, read-only SQL queries. Inspect schemas, review execution plans, and explore data with complete confidence."
        badgeText="Next-Gen Agentic Data Intelligence"
        actionText="Launch Workspace"
        onActionClick={onOpenWorkspace}
        secondaryActionText="Manage Connections"
        onSecondaryActionClick={onOpenConnections}
      />

      {/* Value Proposition / Target Audience Cards */}
      <section className="container mx-auto px-4 md:px-6 py-16 border-t border-neutral-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Built For Modern Data Teams
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            Ask Questions. Review Logic. Get Answers.
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-3">
            Designed for data analysts, software engineers, and product teams who need rapid, transparent database insights without risking accidental mutations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Data Analysts</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Express multidimensional business questions in conversational English. QPilot maps your schema, aggregates metrics, and formats tabular results ready for reporting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Engineers & DBAs</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Every generated query undergoes strict server-side AST read-only validation. Destructive statements (DROP, DELETE, UPDATE) are halted before execution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Business Operators</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Eliminate reporting backlogs. Explore recurring KPIs, monthly cohorts, and regional sales trends without needing specialized SQL syntax knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Workflow (6-step) */}
      <section className="bg-neutral-900/40 border-y border-neutral-800/80 py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Transparent Execution Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              How QPilot Works
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              From natural English prompt to verified analytical outcomes in six verifiable steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Connect Database",
                desc: "Register your PostgreSQL replica or SQLite file with secure, non-destructive connection parameters.",
                icon: Database,
              },
              {
                step: "02",
                title: "Inspect Schema",
                desc: "QPilot explores catalog metadata: tables, foreign keys, column datatypes, and relationship constraints.",
                icon: Layers,
              },
              {
                step: "03",
                title: "Natural Query Input",
                desc: "Ask your question in plain English with business context, filtering conditions, or timeframes.",
                icon: Terminal,
              },
              {
                step: "04",
                title: "Plan & Generate SQL",
                desc: "The agentic planner determines query intent and generates syntactically correct, optimized SQL.",
                icon: Cpu,
              },
              {
                step: "05",
                title: "Read-Only AST Validation",
                desc: "AST security engines verify read-only compliance before any database query execution is permitted.",
                icon: ShieldCheck,
              },
              {
                step: "06",
                title: "Review Results & Insights",
                desc: "Explore returned dataset rows, SQL explanations, and dynamic analytical charts with CSV export.",
                icon: BarChart3,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                        Step {s.step}
                      </span>
                      <Icon className="w-4 h-4 text-neutral-500" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">{s.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Product Workflow Example */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Live Execution Example
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            See the Platform in Action
          </h2>
          <p className="text-neutral-400 text-sm mt-2">
            Example scenario: “Which product categories generated the most revenue from completed orders?”
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl">
          {/* Mock prompt header */}
          <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-neutral-400 ml-2">
                User Question: “Which product categories generated the most revenue from completed orders?”
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Read-Only Validated
            </span>
          </div>

          {/* Generated SQL snippet */}
          <div className="p-4 bg-neutral-950/70 border-b border-neutral-800/80 font-mono text-xs text-cyan-300 overflow-x-auto">
            <pre>{`SELECT 
  p.category, 
  COUNT(DISTINCT o.id) AS completed_orders,
  ROUND(SUM(oi.quantity * oi.unit_price)::numeric, 2) AS total_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY total_revenue DESC;`}</pre>
          </div>

          {/* Sample returned results preview */}
          <div className="p-4">
            <div className="text-xs font-semibold text-neutral-300 mb-2 flex items-center justify-between">
              <span>Returned Result Rows (Preview)</span>
              <span className="text-[10px] font-mono text-neutral-500">5 records returned</span>
            </div>
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="py-2 px-3">category</th>
                    <th className="py-2 px-3">completed_orders</th>
                    <th className="py-2 px-3">total_revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Cloud Infrastructure</td>
                    <td className="py-2 px-3">1,420</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">$348,250.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Developer Tools</td>
                    <td className="py-2 px-3">980</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">$185,600.50</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white font-medium">Data Analytics Suite</td>
                    <td className="py-2 px-3">875</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">$164,200.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Architecture Status Matrix */}
      <section className="bg-neutral-900/30 border-t border-neutral-800 py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Capabilities Transparency
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Implemented Features vs. Roadmap
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              QPilot strictly adheres to backend reality. Only functional modules are represented as active.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Operational Capabilities
              </h3>
              <ul className="text-xs text-neutral-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>FastAPI backend integration with health and query execution contracts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Planner Agent orchestrator evaluating user query tasks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Enforced AST read-only guardrails stopping destructive statements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Interactive SQL inspection with one-click clipboard copying.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Dynamic tabular presentation, CSV export, and chart calculation.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> In-Progress Backend Modules
              </h3>
              <ul className="text-xs text-neutral-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>PostgreSQL live cursor execution in <code className="text-neutral-300">backend/database/connectors/postgres.py</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>SQLite local file connector implementation in <code className="text-neutral-300">connectors/sqlite.py</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Persistent server-side query history database tables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Multi-tenant user authentication and session management.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_70%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Start Querying Your Database in Plain English
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Experience conversational SQL analytics backed by agentic planning and read-only safety guarantees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenWorkspace}
              className="px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Launch Analytics Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDocs}
              className="px-6 py-4 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            >
              Read Architecture Docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
