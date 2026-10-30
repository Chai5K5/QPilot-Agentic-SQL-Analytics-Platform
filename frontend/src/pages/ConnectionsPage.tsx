import React, { useState } from "react";
import { DatabaseConnection, DatabaseType, TableSchema } from "@/types";
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
  ArrowRight,
  Settings2,
  HardDrive
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
  const [selectedEngine, setSelectedEngine] = useState<DatabaseType>("postgresql");
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatusMap, setTestStatusMap] = useState<Record<string, { success: boolean; msg: string }>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const openNewConnection = (engine: DatabaseType) => {
    setSelectedEngine(engine);
    setEditingConnection(null);
    setIsAddModalOpen(true);
  };

  const handleEditConnection = (conn: DatabaseConnection) => {
    setEditingConnection(conn);
    setSelectedEngine(conn.type);
    setIsAddModalOpen(true);
  };

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
            Select your analytics platform, enter credentials, and pick from your local databases.
          </p>
        </div>

        <button
          onClick={() => openNewConnection("postgresql")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Connection</span>
        </button>
      </div>

      {/* Platform Selection Menu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Select Your Analytics Platform
          </h2>
          <span className="text-[11px] text-neutral-500 font-mono">
            Click any platform to connect or discover local databases
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* PostgreSQL Card */}
          <button
            type="button"
            onClick={() => openNewConnection("postgresql")}
            className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500 hover:bg-neutral-900 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                POSTGRESQL
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              PostgreSQL
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Connect to local or remote Postgres and choose from all databases on your server.
            </p>
          </button>

          {/* MySQL Card */}
          <button
            type="button"
            onClick={() => openNewConnection("mysql")}
            className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500 hover:bg-neutral-900 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                MYSQL
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              MySQL
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Enter host & password to discover and connect to any MySQL database.
            </p>
          </button>

          {/* CSV Upload Card */}
          <button
            type="button"
            onClick={() => openNewConnection("csv")}
            className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500 hover:bg-neutral-900 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                CSV FILE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              CSV Spreadsheet
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Upload any CSV file. Schema and columns are automatically inferred for instant queries.
            </p>
          </button>

          {/* SQLite File Card */}
          <button
            type="button"
            onClick={() => openNewConnection("sqlite")}
            className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500 hover:bg-neutral-900 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                SQLITE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              SQLite File
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Scan or enter local path for any .db or .sqlite database file on your system.
            </p>
          </button>
        </div>
      </div>

      {/* Quick Upload CSV / Dataset Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-cyan-950/40 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Quick Upload File (.csv or .db)</h3>
            <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
              Drag & drop a file here to automatically register tables and query them without manual setup.
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Processing File...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Browse File</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Configured Connections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Configured Databases ({connections.length})
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
              <h3 className="text-sm font-semibold text-white">No Database Configured</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Select an analytics platform above to connect your local PostgreSQL, MySQL server, or upload a CSV file.
              </p>
            </div>
            <button
              onClick={() => openNewConnection("postgresql")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Connect PostgreSQL
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
                        ) : conn.type === "sqlite" ? (
                          <HardDrive className="w-5 h-5" />
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
                              <span className="text-white font-semibold">DB: {conn.database || "(not set)"}</span>
                              <span>•</span>
                              <span>User: {conn.username || "postgres"}</span>
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

                      {/* Configure / Edit Credentials */}
                      <button
                        onClick={() => handleEditConnection(conn)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Edit credentials or choose another database"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Configure / Edit</span>
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
                      className={`mt-3 p-3 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border font-mono ${
                        testResult.success
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                          : "bg-rose-950/40 border-rose-800 text-rose-300"
                      }`}
                    >
                      <div className="flex items-start gap-2 break-all">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{testResult.msg}</span>
                      </div>

                      {!testResult.success && (
                        <button
                          onClick={() => handleEditConnection(conn)}
                          className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-semibold flex-shrink-0 cursor-pointer transition-colors"
                        >
                          Enter Password / Select DB
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Connection Modal */}
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingConnection(null);
        }}
        onAddConnection={onAddConnection}
        initialConnection={editingConnection}
        defaultEngine={selectedEngine}
      />
    </div>
  );
}
