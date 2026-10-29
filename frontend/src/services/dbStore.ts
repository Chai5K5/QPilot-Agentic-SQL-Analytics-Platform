import { DatabaseConnection, QueryHistoryEntry, TableSchema } from "@/types";

export const DEFAULT_CONNECTIONS: DatabaseConnection[] = [
  {
    id: "conn-1",
    name: "QPilot SQLite Dev",
    type: "sqlite",
    database: "qpilot_dev.db",
    filePath: "datasets/qpilot_dev.db",
    status: "connected",
    lastChecked: "Just now",
    isDefault: true,
  },
  {
    id: "conn-2",
    name: "PostgreSQL Production Replica",
    type: "postgresql",
    host: "localhost",
    port: 5432,
    database: "qpilot_analytics",
    username: "qpilot_readonly",
    ssl: false,
    status: "disconnected",
    lastChecked: "Offline",
    isDefault: false,
  },
];

export const DEFAULT_SCHEMAS: TableSchema[] = [
  {
    name: "customers",
    description: "Registered customer directory with country and registration dates",
    rowCountEstimate: 8,
    columns: [
      { name: "customer_id", type: "INTEGER", isPrimaryKey: true, nullable: false },
      { name: "customer_name", type: "TEXT", nullable: false },
      { name: "country", type: "TEXT", nullable: false },
      { name: "signup_date", type: "TEXT", nullable: false },
    ],
  },
  {
    name: "categories",
    description: "Product categories hierarchy",
    rowCountEstimate: 4,
    columns: [
      { name: "category_id", type: "INTEGER", isPrimaryKey: true, nullable: false },
      { name: "category_name", type: "TEXT", nullable: false },
    ],
  },
  {
    name: "products",
    description: "Catalog products with pricing, category FK and discontinued flag",
    rowCountEstimate: 10,
    columns: [
      { name: "product_id", type: "INTEGER", isPrimaryKey: true, nullable: false },
      { name: "product_name", type: "TEXT", nullable: false },
      { name: "category_id", type: "INTEGER", isForeignKey: true, references: "categories.category_id", nullable: false },
      { name: "price", type: "REAL", nullable: false },
      { name: "discontinued", type: "INTEGER", nullable: false },
    ],
  },
  {
    name: "orders",
    description: "Customer purchase orders with timestamps and completion status",
    rowCountEstimate: 12,
    columns: [
      { name: "order_id", type: "INTEGER", isPrimaryKey: true, nullable: false },
      { name: "customer_id", type: "INTEGER", isForeignKey: true, references: "customers.customer_id", nullable: false },
      { name: "order_date", type: "TEXT", nullable: false },
      { name: "status", type: "TEXT", nullable: false },
    ],
  },
  {
    name: "order_items",
    description: "Order line item details including quantity and negotiated unit price",
    rowCountEstimate: 23,
    columns: [
      { name: "order_item_id", type: "INTEGER", isPrimaryKey: true, nullable: false },
      { name: "order_id", type: "INTEGER", isForeignKey: true, references: "orders.order_id", nullable: false },
      { name: "product_id", type: "INTEGER", isForeignKey: true, references: "products.product_id", nullable: false },
      { name: "quantity", type: "INTEGER", nullable: false },
      { name: "unit_price", type: "REAL", nullable: false },
    ],
  },
];

const CONNECTIONS_STORAGE_KEY = "qpilot_connections_v2";
const HISTORY_STORAGE_KEY = "qpilot_history_v2";

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
      question: "Which are the top 3 product categories by total revenue from completed orders, excluding discontinued products?",
      generatedSql: `SELECT c.category_name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue\nFROM categories c\nJOIN products p ON c.category_id = p.category_id\nJOIN order_items oi ON p.product_id = oi.product_id\nJOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = 'completed' AND p.discontinued = 0\nGROUP BY c.category_id, c.category_name\nORDER BY total_revenue DESC LIMIT 3;`,
      explanation: "Aggregates revenue across active product categories from completed orders on qpilot_dev.db.",
      status: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      durationMs: 38,
      rowCount: 3,
      connectionName: "QPilot SQLite Dev",
      isReadOnlyValidated: true,
      columns: ["category_name", "total_revenue"],
      rows: [
        { category_name: "Electronics", total_revenue: 1440.0 },
        { category_name: "Home & Kitchen", total_revenue: 570.0 },
        { category_name: "Books", total_revenue: 360.0 },
      ],
    },
    {
      id: "hist-2",
      question: "SELECT * FROM customers LIMIT 5;",
      generatedSql: "SELECT * FROM customers LIMIT 5;",
      explanation: "Direct read-only query on customers table.",
      status: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      durationMs: 12,
      rowCount: 5,
      connectionName: "QPilot SQLite Dev",
      isReadOnlyValidated: true,
      columns: ["customer_id", "customer_name", "country", "signup_date"],
      rows: [
        { customer_id: 1, customer_name: "Aarav Sharma", country: "India", signup_date: "2025-01-15" },
        { customer_id: 2, customer_name: "Emma Wilson", country: "UK", signup_date: "2025-02-20" },
        { customer_id: 3, customer_name: "Liam Brown", country: "USA", signup_date: "2025-03-05" },
        { customer_id: 4, customer_name: "Sophia Garcia", country: "USA", signup_date: "2025-03-18" },
        { customer_id: 5, customer_name: "Noah Martin", country: "France", signup_date: "2025-04-10" },
      ],
    },
    {
      id: "hist-3",
      question: "DROP TABLE customers CASCADE;",
      generatedSql: "-- BLOCKED QUERY ATTEMPT\n-- Safety policy prevented execution:\n-- DROP TABLE customers CASCADE;",
      explanation: "Query was blocked by the safety validator due to forbidden destructive statement (DROP).",
      status: "blocked",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      durationMs: 2,
      rowCount: 0,
      connectionName: "QPilot SQLite Dev",
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
