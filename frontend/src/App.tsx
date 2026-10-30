import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LandingPage } from "@/pages/LandingPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { ConnectionsPage } from "@/pages/ConnectionsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { DocsPage } from "@/pages/DocsPage";
import { 
  DatabaseConnection, 
  QueryHistoryEntry, 
  BackendHealth,
  TableSchema 
} from "@/types";
import { 
  loadSavedConnections, 
  saveConnections, 
  loadQueryHistory, 
  saveQueryHistory 
} from "@/services/dbStore";
import { 
  checkBackendHealth, 
  fetchActiveSchema, 
  connectDatabase 
} from "@/services/api";

const PLACEHOLDER_CONNECTION: DatabaseConnection = {
  id: "none",
  name: "No Database Connected",
  type: "postgresql",
  database: "",
  status: "disconnected",
  isDefault: true,
};

export default function App() {
  const [activePage, setActivePage] = useState<
    "landing" | "workspace" | "connections" | "history" | "docs"
  >("landing");

  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection>(PLACEHOLDER_CONNECTION);
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    status: "checking",
    service: "QPilot Backend",
    version: "1.0.0",
    reachable: false,
  });
  const [workspacePrompt, setWorkspacePrompt] = useState<string>("");

  // Initialize data on mount
  useEffect(() => {
    const savedConns = loadSavedConnections();
    setConnections(savedConns);
    if (savedConns.length > 0) {
      const defaultConn = savedConns.find((c) => c.isDefault) || savedConns[0];
      setActiveConnection(defaultConn);

      // Reconnect active connection on backend to ensure schema is loaded
      connectDatabase(defaultConn).then((res) => {
        if (res.success && res.tables) {
          setSchemas(res.tables);
        }
      });
    } else {
      // Check if backend already has an active connection (e.g. from session or upload)
      fetchActiveSchema().then((res) => {
        if (res.success && res.tables.length > 0) {
          setSchemas(res.tables);
        }
      });
    }

    const savedHistory = loadQueryHistory();
    setQueryHistory(savedHistory);

    // Initial health check
    checkBackendHealth().then((health) => {
      setBackendHealth(health);
    });

    // Periodic heartbeat check
    const interval = setInterval(() => {
      checkBackendHealth().then((health) => {
        setBackendHealth(health);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Connection handlers
  const handleSelectConnection = async (conn: DatabaseConnection, tables?: TableSchema[]) => {
    setActiveConnection(conn);
    const updated = connections.map((c) => ({
      ...c,
      isDefault: c.id === conn.id,
    }));
    setConnections(updated);
    saveConnections(updated);

    if (tables && tables.length > 0) {
      setSchemas(tables);
    } else {
      const res = await connectDatabase(conn);
      if (res.success && res.tables) {
        setSchemas(res.tables);
      }
    }
  };

  const handleAddConnection = (newConn: DatabaseConnection, tables?: TableSchema[]) => {
    const updated = [newConn, ...connections.filter((c) => c.id !== newConn.id)];
    setConnections(updated);
    saveConnections(updated);
    setActiveConnection(newConn);
    if (tables) {
      setSchemas(tables);
    }
  };

  const handleDeleteConnection = (id: string) => {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    saveConnections(updated);
    if (activeConnection.id === id) {
      if (updated.length > 0) {
        handleSelectConnection(updated[0]);
      } else {
        setActiveConnection(PLACEHOLDER_CONNECTION);
        setSchemas([]);
      }
    }
  };

  // History handlers
  const handleSaveHistory = (entry: QueryHistoryEntry) => {
    const updated = [entry, ...queryHistory];
    setQueryHistory(updated);
    saveQueryHistory(updated);
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    saveQueryHistory([]);
  };

  const handleReuseQuestion = (question: string) => {
    setWorkspacePrompt(question);
    setActivePage("workspace");
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Navigation Header */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        backendHealth={backendHealth}
        activeConnectionName={activeConnection.name}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {activePage === "landing" && (
          <LandingPage
            onOpenWorkspace={() => setActivePage("workspace")}
            onOpenConnections={() => setActivePage("connections")}
            onOpenDocs={() => setActivePage("docs")}
          />
        )}

        {activePage === "workspace" && (
          <WorkspacePage
            connections={connections.length > 0 ? connections : [activeConnection]}
            activeConnection={activeConnection}
            onSelectConnection={handleSelectConnection}
            schemas={schemas}
            onOpenConnections={() => setActivePage("connections")}
            onSaveHistory={handleSaveHistory}
            initialQuestion={workspacePrompt}
          />
        )}

        {activePage === "connections" && (
          <ConnectionsPage
            connections={connections}
            activeConnection={activeConnection.id !== "none" ? activeConnection : null}
            onSelectConnection={handleSelectConnection}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onOpenWorkspace={() => setActivePage("workspace")}
          />
        )}

        {activePage === "history" && (
          <HistoryPage
            history={queryHistory}
            onClearHistory={handleClearHistory}
            onReuseQuestion={handleReuseQuestion}
          />
        )}

        {activePage === "docs" && <DocsPage />}
      </main>

      {/* Global Application Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}
