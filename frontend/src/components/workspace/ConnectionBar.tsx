import React from "react";
import { DatabaseConnection } from "@/types";
import { Database, CheckCircle2, AlertTriangle, ChevronDown, Layers, Settings } from "lucide-react";

interface ConnectionBarProps {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection;
  onSelectConnection: (conn: DatabaseConnection) => void;
  onToggleSchema: () => void;
  isSchemaOpen: boolean;
  onManageConnections: () => void;
  tableCount: number;
}

export function ConnectionBar({
  connections,
  activeConnection,
  onSelectConnection,
  onToggleSchema,
  isSchemaOpen,
  onManageConnections,
  tableCount,
}: ConnectionBarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      {/* Active Connection & Switcher */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700/80 hover:border-neutral-600 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-tight">
                  {activeConnection.name}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                  {activeConnection.type}
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-400">
                {activeConnection.type === "sqlite"
                  ? activeConnection.filePath || "local file"
                  : `${activeConnection.host || "localhost"}:${activeConnection.port || 5432}/${activeConnection.database}`}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          </button>

          {/* Connection Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-40 p-1.5 space-y-1">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Select Connected Database
              </div>
              {connections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectConnection(c);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                    c.id === activeConnection.id
                      ? "bg-cyan-950/60 text-cyan-200 border border-cyan-800/60"
                      : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono truncate">
                      {c.database} ({c.type})
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.status === "connected" ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                </button>
              ))}

              <div className="border-t border-neutral-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onManageConnections();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-cyan-400 hover:bg-neutral-900 rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage Connections
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Reachability Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-neutral-950/60 border border-neutral-800">
          {activeConnection.status === "connected" ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Reachable (Read-Only)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Standby (Verify Credentials)</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Schema toggle & Connection Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSchema}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isSchemaOpen
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
              : "bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Schema Explorer</span>
          <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
            {tableCount} tables
          </span>
        </button>

        <button
          onClick={onManageConnections}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-950 border border-neutral-800 hover:text-white hover:border-neutral-700 transition-colors"
          title="Configure Database Connection"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
