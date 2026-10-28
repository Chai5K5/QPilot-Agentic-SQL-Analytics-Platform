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
  BackendHealth 
} from "@/types";
import { 
  loadSavedConnections, 
  saveConnections, 
  DEFAULT_SCHEMAS, 
  loadQueryHistory, 
  saveQueryHistory 
} from "@/services/dbStore";
import { checkBackendHealth } from "@/services/api";

export default function App() {
  const [activePage, setActivePage] = useState<
    "landing" | "workspace" | "connections" | "history" | "docs"
  >("landing");

  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);
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
    const defaultConn = savedConns.find((c) => c.isDefault) || savedConns[0];
    setActiveConnection(defaultConn);

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
  const handleSelectConnection = (conn: DatabaseConnection) => {
    setActiveConnection(conn);
    const updated = connections.map((c) => ({
      ...c,
      isDefault: c.id === conn.id,
    }));
    setConnections(updated);
    saveConnections(updated);
  };

  const handleAddConnection = (newConn: DatabaseConnection) => {
    const updated = [newConn, ...connections];
    setConnections(updated);
    saveConnections(updated);
    setActiveConnection(newConn);
  };

  const handleDeleteConnection = (id: string) => {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    saveConnections(updated);
    if (activeConnection?.id === id && updated.length > 0) {
      setActiveConnection(updated[0]);
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
        activeConnectionName={activeConnection?.name || "No Connection"}
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

        {activePage === "workspace" && activeConnection && (
          <WorkspacePage
            connections={connections}
            activeConnection={activeConnection}
            onSelectConnection={handleSelectConnection}
            schemas={DEFAULT_SCHEMAS}
            onOpenConnections={() => setActivePage("connections")}
            onSaveHistory={handleSaveHistory}
            initialQuestion={workspacePrompt}
          />
        )}

        {activePage === "connections" && activeConnection && (
          <ConnectionsPage
            connections={connections}
            activeConnection={activeConnection}
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
