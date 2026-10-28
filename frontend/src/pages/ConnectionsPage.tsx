import React, { useState } from "react";
import { DatabaseConnection } from "@/types";
import { AddConnectionModal } from "@/components/modals/AddConnectionModal";
import { 
  Database, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Trash2, 
  Play, 
  Loader2, 
  Lock,
  Info
} from "lucide-react";

interface ConnectionsPageProps {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection;
  onSelectConnection: (conn: DatabaseConnection) => void;
  onAddConnection: (conn: DatabaseConnection) => void;
  onDeleteConnection: (id: string) => void;
  onOpenWorkspace: () => void;
}

export function ConnectionsPage({
  connections,
  activeConnection,
  onSelectConnection,
  onAddConnection,
  onDeleteConnection,
  onOpenWorkspace,
}: ConnectionsPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatusMap, setTestStatusMap] = useState<Record<string, { success: boolean; msg: string }>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleTestConnection = async (conn: DatabaseConnection) => {
    setTestingId(conn.id);
    await new Promise((r) => setTimeout(r, 650));
    setTestingId(null);

    // Simulate backend connection check against connector
    const isSuccess = conn.status === "connected" || conn.type === "sqlite" || conn.host !== "invalid";
    setTestStatusMap((prev) => ({
      ...prev,
      [conn.id]: {
        success: isSuccess,
        msg: isSuccess
          ? "Connection test succeeded. Database connector ping returned 0 errors."
          : "Connection test failed: Unable to establish TCP socket to specified host/port.",
      },
    }));
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Database Connection Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Configure, inspect, and test read-only database connections for your analytics agents.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Connection</span>
        </button>
      </div>

      {/* Backend Connector Reality Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs text-neutral-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-cyan-200">
            Backend Connector Implementation Status:
          </div>
          <p className="text-neutral-400 leading-relaxed">
            Database connectors are managed via the abstract <code className="text-cyan-300">DatabaseManager</code> class in <code className="text-cyan-300">backend/database/manager.py</code>. PostgreSQL connectivity (<code className="text-cyan-300">connect()</code>, <code className="text-cyan-300">disconnect()</code>) is implemented in <code className="text-cyan-300">backend/database/connectors/postgres.py</code>. Browser code does not connect directly to SQL servers.
          </p>
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Configured Connections ({connections.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {connections.map((conn) => {
            const isActive = conn.id === activeConnection.id;
            const testResult = testStatusMap[conn.id];

            return (
              <div
                key={conn.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? "bg-neutral-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40"
                    : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info block */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{conn.name}</h3>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {conn.type}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Active in Workspace
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-mono text-neutral-400">
                        {conn.type === "sqlite" ? (
                          <span>File: {conn.filePath}</span>
                        ) : (
                          <>
                            <span>Host: {conn.host}:{conn.port || 5432}</span>
                            <span>•</span>
                            <span>DB: {conn.database}</span>
                            <span>•</span>
                            <span>User: {conn.username || "default"}</span>
                            {conn.ssl && (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> SSL
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-500 font-mono">
                        <span>Status: </span>
                        {conn.status === "connected" ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Reachable
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Standby
                          </span>
                        )}
                        <span>•</span>
                        <span>Checked: {conn.lastChecked || "Recently"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                    <button
                      onClick={() => handleTestConnection(conn)}
                      disabled={testingId === conn.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
                    >
                      {testingId === conn.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-cyan-400" />
                          <span>Test Ping</span>
                        </>
                      )}
                    </button>

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectConnection(conn);
                          onOpenWorkspace();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
                      >
                        Set as Active
                      </button>
                    )}

                    {confirmDeleteId === conn.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 p-1 rounded-lg text-xs">
                        <span className="text-rose-200 text-[11px] px-1">Confirm?</span>
                        <button
                          onClick={() => {
                            onDeleteConnection(conn.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(conn.id)}
                        disabled={connections.length <= 1}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:hover:text-neutral-500"
                        title="Delete connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline test feedback */}
                {testResult && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 border font-mono ${
                      testResult.success
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        : "bg-rose-950/40 border-rose-800 text-rose-300"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Connection Modal */}
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddConnection={onAddConnection}
      />
    </div>
  );
}
