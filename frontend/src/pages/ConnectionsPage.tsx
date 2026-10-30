import React, { useState } from "react";
import { DatabaseConnection, TableSchema } from "@/types";
import { AddConnectionModal } from "@/components/modals/AddConnectionModal";
import { testDatabaseConnection, uploadDatabaseFile, connectDatabase } from "@/services/api";
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
  Upload,
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";

interface ConnectionsPageProps {
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  onSelectConnection: (conn: DatabaseConnection, tables?: TableSchema[]) => void;
  onAddConnection: (conn: DatabaseConnection, tables?: TableSchema[]) => void;
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTestConnection = async (conn: DatabaseConnection) => {
    setTestingId(conn.id);
    const res = await testDatabaseConnection(conn);
    setTestingId(null);

    setTestStatusMap((prev) => ({
      ...prev,
      [conn.id]: {
        success: res.success,
        msg: res.message,
      },
    }));
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadDatabaseFile(file);
      if (!res.success || !res.connection) {
        setUploadError(res.message || "Upload failed.");
        setIsUploading(false);
        return;
      }

      onAddConnection(res.connection, res.tables);
      setIsUploading(false);
      onOpenWorkspace();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
      setIsUploading(false);
    }
  };

  const handleActivateConnection = async (conn: DatabaseConnection) => {
    const res = await connectDatabase(conn);
    if (res.success) {
      onSelectConnection({ ...conn, status: "connected" }, res.tables);
      onOpenWorkspace();
    } else {
      setTestStatusMap((prev) => ({
        ...prev,
        [conn.id]: {
          success: false,
          msg: res.message || "Could not activate connection.",
        },
      }));
    }
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
            Connect your PostgreSQL, MySQL server, or upload a CSV file to query with QPilot.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Connection</span>
        </button>
      </div>

      {/* Quick Upload CSV / Dataset Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-cyan-950/40 border border-neutral-800 hover:border-cyan-800/80 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Have a CSV or SQLite file?</h3>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              Upload any spreadsheet data (.csv) or SQLite database (.db). QPilot automatically parses headers, detects types, maps the schema, and prepares it for instant querying.
            </p>
            {uploadError && (
              <p className="text-xs text-rose-400 font-medium pt-1">
                ⚠️ {uploadError}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <input
            type="file"
            id="quick-csv-upload"
            accept=".csv,.db,.sqlite,.sqlite3"
            onChange={handleQuickUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="quick-csv-upload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Processing File...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload CSV / DB</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Configured Connections ({connections.length})
          </h2>
          {activeConnection && (
            <button
              onClick={onOpenWorkspace}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {connections.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <Database className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No Database Connected</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Connect your PostgreSQL or MySQL database, or upload a CSV file above to start analyzing.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Connect Database
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {connections.map((conn) => {
              const isActive = activeConnection?.id === conn.id;
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
                        {conn.type === "csv" ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <Server className="w-5 h-5" />
                        )}
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
                          {conn.type === "sqlite" || conn.type === "csv" ? (
                            <span>File: {conn.filePath || conn.database}</span>
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
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Standby
                            </span>
                          )}
                          {conn.tableCount !== undefined && (
                            <>
                              <span>•</span>
                              <span>{conn.tableCount} tables loaded</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                      <button
                        onClick={() => handleTestConnection(conn)}
                        disabled={testingId === conn.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                          onClick={() => handleActivateConnection(conn)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors cursor-pointer"
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
                            className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(conn.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
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
        )}
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
