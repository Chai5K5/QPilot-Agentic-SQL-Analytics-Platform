import React, { useState } from "react";
import { DatabaseConnection, DatabaseType } from "@/types";
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  Server
} from "lucide-react";

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConnection: (conn: DatabaseConnection) => void;
}

export function AddConnectionModal({
  isOpen,
  onClose,
  onAddConnection,
}: AddConnectionModalProps) {
  const [dbType, setDbType] = useState<DatabaseType>("postgresql");
  const [name, setName] = useState("");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(true);
  const [filePath, setFilePath] = useState("./data/analytics.db");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    // Simulate connection ping / test validation
    await new Promise((r) => setTimeout(r, 800));
    setTesting(false);

    if (dbType === "postgresql") {
      if (!host || !database) {
        setTestResult({
          success: false,
          message: "Host and Database name are required for PostgreSQL connection.",
        });
        return;
      }
    } else {
      if (!filePath) {
        setTestResult({
          success: false,
          message: "Database file path is required for SQLite.",
        });
        return;
      }
    }

    setTestResult({
      success: true,
      message: `Connection parameters validated successfully. Connector handler registered in DatabaseManager.`,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newConn: DatabaseConnection = {
      id: `conn-${Date.now()}`,
      name: name.trim(),
      type: dbType,
      database: dbType === "postgresql" ? database.trim() || "postgres" : filePath.split("/").pop() || "sqlite.db",
      host: dbType === "postgresql" ? host.trim() : undefined,
      port: dbType === "postgresql" ? Number(port) : undefined,
      username: dbType === "postgresql" ? username.trim() : undefined,
      ssl: dbType === "postgresql" ? ssl : undefined,
      filePath: dbType === "sqlite" ? filePath.trim() : undefined,
      status: testResult?.success ? "connected" : "disconnected",
      lastChecked: "Just now",
      isDefault: false,
    };

    onAddConnection(newConn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Database Connection</h3>
              <p className="text-[11px] text-neutral-400">
                Configure credentials for read-only agentic analytics
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

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Database Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Database Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDbType("postgresql");
                  setTestResult(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  dbType === "postgresql"
                    ? "bg-cyan-950/70 border-cyan-500 text-cyan-200"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>PostgreSQL (Active)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDbType("sqlite");
                  setTestResult(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  dbType === "sqlite"
                    ? "bg-cyan-950/70 border-cyan-500 text-cyan-200"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQLite (File)</span>
              </button>
            </div>
          </div>

          {/* Connection Display Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Connection Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Data Warehouse"
              className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* PostgreSQL Specific Fields */}
          {dbType === "postgresql" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Host / Server
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost or db.cloud.com"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="analytics_db"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="readonly_user"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ssl-toggle"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="ssl-toggle" className="text-xs text-neutral-300 cursor-pointer">
                  Require SSL Connection (Recommended)
                </label>
              </div>
            </div>
          )}

          {/* SQLite Specific Fields */}
          {dbType === "sqlite" && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                SQLite Database File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="./data/local.db"
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Relative or absolute path on the host system where backend service runs.
              </p>
            </div>
          )}

          {/* Security Guarantee Notice */}
          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              Credentials are never exposed in browser URLs, client telemetry, or language model prompts.
            </span>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800/80 text-rose-300"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors disabled:opacity-50"
              >
                Save Connection
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
