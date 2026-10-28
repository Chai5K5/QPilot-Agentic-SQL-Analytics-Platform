import React, { useState } from "react";
import { BackendHealth } from "@/types";
import { 
  Database, 
  Terminal, 
  History, 
  BookOpen, 
  Sparkles, 
  Menu, 
  X
} from "lucide-react";

interface NavbarProps {
  activePage: "landing" | "workspace" | "connections" | "history" | "docs";
  setActivePage: (page: "landing" | "workspace" | "connections" | "history" | "docs") => void;
  backendHealth: BackendHealth;
  activeConnectionName: string;
}

export function Navbar({
  activePage,
  setActivePage,
  backendHealth,
  activeConnectionName,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Overview", icon: Sparkles },
    { id: "workspace", label: "Workspace", icon: Terminal },
    { id: "connections", label: "Connections", icon: Database },
    { id: "history", label: "History", icon: History },
    { id: "docs", label: "Docs & Guides", icon: BookOpen },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActivePage("landing")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                QPilot
              </span>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase">
                Agentic
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 -mt-0.5 hidden sm:block">
              SQL Analytics Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-neutral-800 text-white shadow-inner border border-neutral-700/60"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status badges & Action CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Backend Health Badge */}
          <div
            title={backendHealth.reachable ? "FastAPI backend is active" : backendHealth.error || "Backend unreachable"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              backendHealth.reachable
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-amber-950/40 border-amber-800/60 text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth.reachable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="font-mono text-[11px]">
              {backendHealth.reachable ? "Backend: Online (v1.0)" : "Backend: Standby"}
            </span>
          </div>

          {/* Quick connection indicator */}
          <button
            onClick={() => setActivePage("connections")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[130px]">{activeConnectionName}</span>
          </button>

          {activePage !== "workspace" && (
            <button
              onClick={() => setActivePage("workspace")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Terminal className="w-4 h-4" />
              Open Workspace
            </button>
          )}
        </div>

        {/* Mobile menu hamburger toggle */}
        <div className="flex md:hidden items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              backendHealth.reachable ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-2 py-1">
              <span>Backend status:</span>
              <span className={backendHealth.reachable ? "text-emerald-400" : "text-amber-400"}>
                {backendHealth.reachable ? "FastAPI Connected" : "Local Standby Mode"}
              </span>
            </div>
            <button
              onClick={() => {
                setActivePage("workspace");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-cyan-500 text-neutral-950"
            >
              <Terminal className="w-4 h-4" />
              Launch Analytics Workspace
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
