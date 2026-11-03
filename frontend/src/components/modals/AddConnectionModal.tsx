import React, { useState, useEffect } from "react";
import { DatabaseConnection, DatabaseType, TableSchema } from "@/types";
import { 
  testDatabaseConnection, 
  connectDatabase, 
  uploadDatabaseFile, 
  listAvailableDatabases 
} from "@/services/api";
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Server, 
  Upload, 
  FileSpreadsheet, 
  RefreshCw,
  Search
} from "lucide-react";

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConnection: (conn: DatabaseConnection, tables?: TableSchema[]) => void;
  initialConnection?: DatabaseConnection | null;
  defaultEngine?: DatabaseType;
}

export function AddConnectionModal({
  isOpen,
  onClose,
  onAddConnection,
  initialConnection = null,
  defaultEngine = "postgresql",
}: AddConnectionModalProps) {
  const [dbType, setDbType] = useState<DatabaseType>("postgresql");
  const [name, setName] = useState("");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("postgres");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);
  const [filePath, setFilePath] = useState("");

  // File upload state for CSV/SQLite
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Discovered databases from local server
  const [discoveredDbs, setDiscoveredDbs] = useState<string[]>([]);
  const [fetchingDbs, setFetchingDbs] = useState(false);

  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or initialConnection changes
  useEffect(() => {
    if (isOpen) {
      if (initialConnection) {
        setDbType(initialConnection.type);
        setName(initialConnection.name || "");
        setHost(initialConnection.host || "localhost");
        setPort(initialConnection.port || (initialConnection.type === "mysql" ? 3306 : 5432));
        setDatabase(initialConnection.database || "");
        setUsername(initialConnection.username || (initialConnection.type === "mysql" ? "root" : "postgres"));
        setPassword(initialConnection.password || "");
        setSsl(initialConnection.ssl ?? false);
        setFilePath(initialConnection.filePath || "");
      } else {
        setDbType(defaultEngine);
        setName("");
        setHost("localhost");
        setPort(defaultEngine === "mysql" ? 3306 : 5432);
        setDatabase("");
        setUsername(defaultEngine === "mysql" ? "root" : "postgres");
        setPassword("");
        setSsl(false);
        setFilePath("");
      }
      setSelectedFile(null);
      setDiscoveredDbs([]);
      setTestResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialConnection, defaultEngine]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
      setTestResult({
        success: true,
        message: `File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Click 'Save & Connect' to load table.`,
      });
    }
  };

  const handleDiscoverDatabases = async () => {
    setFetchingDbs(true);
    setErrorMsg(null);
    setTestResult(null);

    const creds: Partial<DatabaseConnection> = {
      type: dbType,
      host: host.trim() || "localhost",
      port: Number(port),
      username: username.trim(),
      password,
      ssl,
      database: database.trim() || undefined,
      filePath: filePath.trim() || undefined,
    };

    const res = await listAvailableDatabases(creds);
    setFetchingDbs(false);

    if (res.success && res.databases.length > 0) {
      setDiscoveredDbs(res.databases);
      if (!database || !res.databases.includes(database)) {
        setDatabase(res.databases[0]);
      }
      setTestResult({
        success: true,
        message: `Discovered ${res.databases.length} databases on server. Select one from the dropdown menu!`,
      });
    } else {
      setErrorMsg(res.message || "Failed to discover databases. Please check credentials or host.");
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMsg(null);

    if (dbType === "csv") {
      setTesting(false);
      if (!selectedFile) {
        setTestResult({
          success: false,
          message: "Please choose a CSV or SQLite file to upload first.",
        });
        return;
      }
      setTestResult({
        success: true,
        message: `File ready: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB).`,
      });
      return;
    }

    if (dbType === "sqlite") {
      if (!filePath.trim()) {
        setTesting(false);
        setTestResult({
          success: false,
          message: "Please enter or select a database file path.",
        });
        return;
      }
    }

    if (dbType === "postgresql" || dbType === "mysql") {
      if (!host.trim() || !database.trim()) {
        setTesting(false);
        setTestResult({
          success: false,
          message: "Host and Database name are required. Click 'Discover Databases' to pick from your local server.",
        });
        return;
      }
    }

    const payload: Partial<DatabaseConnection> = {
      type: dbType,
      host: host.trim(),
      port: Number(port),
      database: database.trim(),
      username: username.trim(),
      password,
      ssl,
      filePath: filePath.trim(),
    };

    const res = await testDatabaseConnection(payload);
    setTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConnecting(true);

    try {
      if (dbType === "csv") {
        if (!selectedFile) {
          setErrorMsg("Please select a CSV or SQLite file to upload.");
          setConnecting(false);
          return;
        }

        const uploadRes = await uploadDatabaseFile(selectedFile);
        if (!uploadRes.success || !uploadRes.connection) {
          setErrorMsg(uploadRes.message || "Failed to upload and load file.");
          setConnecting(false);
          return;
        }

        const newConn: DatabaseConnection = {
          ...uploadRes.connection,
          id: initialConnection?.id || uploadRes.connection.id,
          name: name.trim() || uploadRes.connection.name || selectedFile.name,
          isDefault: true,
          status: "connected",
        };

        onAddConnection(newConn, uploadRes.tables);
        setConnecting(false);
        onClose();
        return;
      }

      // PostgreSQL, MySQL, or local SQLite
      const connPayload: Partial<DatabaseConnection> = {
        id: initialConnection?.id,
        name: name.trim() || `${database.trim() || dbType.toUpperCase()}`,
        type: dbType,
        host: host.trim(),
        port: Number(port),
        database: database.trim(),
        username: username.trim(),
        password,
        ssl,
        filePath: filePath.trim(),
      };

      const connectRes = await connectDatabase(connPayload);
      if (!connectRes.success || !connectRes.connection) {
        setErrorMsg(connectRes.message || "Failed to establish database connection.");
        setConnecting(false);
        return;
      }

      const newConn: DatabaseConnection = {
        ...connectRes.connection,
        name: name.trim() || connectRes.connection.name,
        password: password || initialConnection?.password,
        ssl: ssl,
        isDefault: true,
        status: "connected",
      };

      onAddConnection(newConn, connectRes.tables);
      setConnecting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {initialConnection ? `Configure: ${initialConnection.name}` : "Connect Analytics Database"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Choose platform, enter credentials, and pick from your local databases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Platform Selector Menu */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Select Analytics Platform / Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDbType("postgresql");
                  setPort(5432);
                  setUsername("postgres");
                  setDiscoveredDbs([]);
                  setTestResult(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  dbType === "postgresql"
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>PostgreSQL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDbType("mysql");
                  setPort(3306);
                  setUsername("root");
                  setDiscoveredDbs([]);
                  setTestResult(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  dbType === "mysql"
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>MySQL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDbType("csv");
                  setDiscoveredDbs([]);
                  setTestResult(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  dbType === "csv"
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDbType("sqlite");
                  setDiscoveredDbs([]);
                  setTestResult(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  dbType === "sqlite"
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQLite File</span>
              </button>
            </div>
          </div>

          {/* Connection Label */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Connection Display Name
            </label>
            <input
              type="text"
              required
              placeholder={
                dbType === "postgresql"
                  ? "e.g. Local PostgreSQL or Production DW"
                  : dbType === "mysql"
                  ? "e.g. Local MySQL Database"
                  : dbType === "csv"
                  ? "e.g. E-Commerce Sales CSV"
                  : "e.g. Local SQLite Store"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* CSV File Upload Section */}
          {dbType === "csv" && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-neutral-300">
                Upload CSV or SQLite File (.csv, .db, .sqlite)
              </label>
              <div className="border-2 border-dashed border-neutral-700 hover:border-cyan-500 rounded-xl p-6 text-center bg-neutral-950/60 transition-colors">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,.db,.sqlite,.sqlite3"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-9 h-9 text-cyan-400" />
                  <span className="text-xs font-semibold text-white">
                    {selectedFile ? selectedFile.name : "Choose a CSV or SQLite file"}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB — Click to change`
                      : "Drag & drop or browse from your computer"}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* PostgreSQL & MySQL Credentials */}
          {(dbType === "postgresql" || dbType === "mysql") && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Host / Server Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="localhost or 127.0.0.1"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder={dbType === "postgresql" ? "postgres" : "root"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Database Discovery & Selection Menu */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Database Name</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDiscoverDatabases}
                    disabled={fetchingDbs}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Connects to server and queries available databases"
                  >
                    {fetchingDbs ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Discover Local Databases</span>
                  </button>
                </div>

                {discoveredDbs.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Choose from {discoveredDbs.length} databases available to you:</span>
                      <button
                        type="button"
                        onClick={() => setDiscoveredDbs([])}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Type manually
                      </button>
                    </div>
                    <select
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-cyan-500 text-cyan-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    >
                      {discoveredDbs.map((db) => (
                        <option key={db} value={db} className="bg-neutral-900 text-white font-sans">
                          {db}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={
                        dbType === "postgresql"
                          ? "e.g. postgres (or click 'Discover Local Databases')"
                          : "e.g. my_database (or click 'Discover Local Databases')"
                      }
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              {dbType === "postgresql" && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="ssl-toggle"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="ssl-toggle" className="text-xs text-neutral-300 flex items-center gap-1 cursor-pointer">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Enable SSL / TLS encryption</span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* SQLite Path Input & Discovery */}
          {dbType === "sqlite" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-300">
                  Database File Path
                </label>
                <button
                  type="button"
                  onClick={handleDiscoverDatabases}
                  disabled={fetchingDbs}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {fetchingDbs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  <span>Scan Local DBs</span>
                </button>
              </div>

              {discoveredDbs.length > 0 ? (
                <select
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-cyan-500 text-cyan-200 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose local database --</option>
                  {discoveredDbs.map((db) => (
                    <option key={db} value={db} className="bg-neutral-900 text-white font-sans">
                      {db}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. C:/data/analytics.db or backend/data/uploads/user_uploads.db"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg text-xs flex items-start gap-2 bg-rose-950/50 border border-rose-900/80 text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed whitespace-pre-wrap break-all font-mono text-[11px]">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Test / Feedback Notice */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-200"
                  : "bg-rose-950/40 border border-rose-900/60 text-rose-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-mono text-[11px] break-all">{testResult.message}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || connecting}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test Ping</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
