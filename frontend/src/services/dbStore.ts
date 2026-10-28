import { DatabaseConnection, QueryHistoryEntry, TableSchema } from "@/types";

export const DEFAULT_CONNECTIONS: DatabaseConnection[] = [
  {
    id: "conn-1",
    name: "PostgreSQL Production Replica",
    type: "postgresql",
    host: "db.production.internal",
    port: 5432,
    database: "qpilot_analytics",
    username: "qpilot_readonly",
    ssl: true,
    status: "connected",
    lastChecked: "Just now",
    isDefault: true,
  },
  {
    id: "conn-2",
    name: "SQLite Local Store",
    type: "sqlite",
    database: "local_warehouse.db",
    filePath: "./data/local_warehouse.db",
    status: "connected",
    lastChecked: "2 hours ago",
    isDefault: false,
  },
  {
    id: "conn-3",
    name: "E-Commerce DW (Staging)",
    type: "postgresql",
    host: "dw-staging.cloud.net",
    port: 5432,
    database: "ecom_staging",
    username: "dw_analyst",
    ssl: true,
    status: "disconnected",
    lastChecked: "Yesterday",
    isDefault: false,
  },
];

export const DEFAULT_SCHEMAS: TableSchema[] = [
  {
    name: "orders",
    description: "Core transaction records with completion status and timestamps",
    rowCountEstimate: 142500,
    columns: [
      { name: "id", type: "UUID", isPrimaryKey: true, nullable: false },
      { name: "customer_id", type: "UUID", isForeignKey: true, references: "customers.id", nullable: false },
      { name: "status", type: "VARCHAR(32)", nullable: false },
      { name: "total_amount", type: "NUMERIC(12,2)", nullable: false },
      { name: "currency", type: "VARCHAR(3)", nullable: false },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false },
      { name: "updated_at", type: "TIMESTAMP WITH TIME ZONE", nullable: true },
    ],
  },
  {
    name: "order_items",
    description: "Line items associated with each order, quantity and unit price",
    rowCountEstimate: 420800,
    columns: [
      { name: "id", type: "UUID", isPrimaryKey: true, nullable: false },
      { name: "order_id", type: "UUID", isForeignKey: true, references: "orders.id", nullable: false },
      { name: "product_id", type: "UUID", isForeignKey: true, references: "products.id", nullable: false },
      { name: "quantity", type: "INTEGER", nullable: false },
      { name: "unit_price", type: "NUMERIC(10,2)", nullable: false },
    ],
  },
  {
    name: "products",
    description: "Catalog products, categories, SKU identifiers and base prices",
    rowCountEstimate: 5400,
    columns: [
      { name: "id", type: "UUID", isPrimaryKey: true, nullable: false },
      { name: "product_name", type: "VARCHAR(255)", nullable: false },
      { name: "category", type: "VARCHAR(100)", nullable: false },
      { name: "sku", type: "VARCHAR(64)", nullable: false },
      { name: "price", type: "NUMERIC(10,2)", nullable: false },
      { name: "is_active", type: "BOOLEAN", nullable: false },
    ],
  },
  {
    name: "customers",
    description: "Client account profiles, company names, and membership tiers",
    rowCountEstimate: 18900,
    columns: [
      { name: "id", type: "UUID", isPrimaryKey: true, nullable: false },
      { name: "name", type: "VARCHAR(255)", nullable: false },
      { name: "email", type: "VARCHAR(255)", nullable: false },
      { name: "tier", type: "VARCHAR(50)", nullable: false },
      { name: "country", type: "VARCHAR(2)", nullable: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "analytics_jobs",
    description: "Execution logs for scheduled tasks, batch pipelines and query jobs",
    rowCountEstimate: 89000,
    columns: [
      { name: "id", type: "BIGINT", isPrimaryKey: true, nullable: false },
      { name: "status", type: "VARCHAR(24)", nullable: false },
      { name: "duration_ms", type: "DOUBLE PRECISION", nullable: false },
      { name: "processed_bytes", type: "BIGINT", nullable: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
];

const CONNECTIONS_STORAGE_KEY = "qpilot_connections_v1";
const HISTORY_STORAGE_KEY = "qpilot_history_v1";

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
  return [
    {
      id: "hist-1",
      question: "Which product categories generated the most revenue from completed orders?",
      generatedSql: `SELECT p.category, SUM(oi.quantity * oi.unit_price) AS total_revenue\nFROM orders o\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id\nWHERE o.status = 'completed'\nGROUP BY p.category ORDER BY total_revenue DESC;`,
      explanation: "Aggregates revenue across categories for completed orders.",
      status: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      durationMs: 48,
      rowCount: 5,
      connectionName: "PostgreSQL Production Replica",
      isReadOnlyValidated: true,
    },
    {
      id: "hist-2",
      question: "Show top enterprise customers by completed orders and lifetime value",
      generatedSql: `SELECT c.name, COUNT(o.id) AS orders, SUM(o.total_amount) AS ltv\nFROM customers c JOIN orders o ON c.id = o.customer_id\nWHERE c.tier = 'Enterprise' GROUP BY c.name ORDER BY ltv DESC LIMIT 5;`,
      explanation: "Ranks top enterprise customers based on historical order volume and lifetime spend.",
      status: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      durationMs: 53,
      rowCount: 5,
      connectionName: "PostgreSQL Production Replica",
      isReadOnlyValidated: true,
    },
    {
      id: "hist-3",
      question: "DROP TABLE customers CASCADE;",
      generatedSql: "-- BLOCKED QUERY ATTEMPT\n-- Safety policy prevented execution:\n-- DROP TABLE customers CASCADE;",
      explanation: "Query was blocked by the safety validator due to forbidden destructive statement (DROP).",
      status: "blocked",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      durationMs: 4,
      rowCount: 0,
      connectionName: "PostgreSQL Production Replica",
      errorMessage: "Query contains forbidden destructive statement (DROP table/schema/database).",
      isReadOnlyValidated: false,
    },
  ];
}

export function saveQueryHistory(history: QueryHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error saving query history", e);
  }
}
