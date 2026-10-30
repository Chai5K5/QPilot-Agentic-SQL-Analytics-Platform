import { DatabaseConnection, QueryHistoryEntry, TableSchema } from "@/types";

export const DEFAULT_CONNECTIONS: DatabaseConnection[] = [];

export const DEFAULT_SCHEMAS: TableSchema[] = [];

const CONNECTIONS_STORAGE_KEY = "qpilot_user_connections_v3";
const HISTORY_STORAGE_KEY = "qpilot_query_history_v3";

export function loadSavedConnections(): DatabaseConnection[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading connections from storage", e);
  }
  return DEFAULT_CONNECTIONS;
}

export function saveConnections(connections: DatabaseConnection[]) {
  try {
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
  } catch (e) {
    console.error("Error saving connections", e);
  }
}

export function loadQueryHistory(): QueryHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading query history", e);
  }
  return [];
}

export function saveQueryHistory(history: QueryHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error saving query history", e);
  }
}
