"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SQL_SNIPPETS = [
  "SELECT category, SUM(revenue) AS total_rev FROM orders WHERE status = 'completed' GROUP BY category ORDER BY total_rev DESC;",
  "SELECT c.name, COUNT(o.id) AS total_orders FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.name;",
  "SELECT DATE_TRUNC('month', created_at) AS month, AVG(order_value) AS aov FROM analytics_events GROUP BY 1;",
  "WITH ranked_sales AS (SELECT product_id, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) as rk FROM sales) SELECT * FROM ranked_sales WHERE rk <= 10;",
  "SELECT p.product_name, SUM(oi.quantity * oi.unit_price) AS gross_sales FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY 1;",
  "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name;",
  "SELECT status, count(*) AS query_count FROM transaction_logs WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY status;",
  "EXPLAIN ANALYZE SELECT u.email, count(q.id) FROM users u JOIN query_history q ON u.id = q.user_id GROUP BY u.email;",
  "SELECT id, plan_name, cost, execution_time_ms FROM query_execution_plans WHERE execution_time_ms < 50;",
  "SELECT DATE(created_at) AS date, COUNT(*) AS daily_active_queries FROM query_sessions GROUP BY DATE(created_at) ORDER BY date DESC;",
  "SELECT database_name, connection_status, last_checked_at FROM connection_pool WHERE is_healthy = true;",
  "SELECT AVG(execution_duration_ms) AS p50_latency FROM query_benchmarks WHERE dialect = 'postgresql';",
];

export function FloatingPaths({ position }: { position: number }) {
  const baseId = useId().replace(/:/g, "_");

  // Generate smooth curved streams across the screen
  const paths = Array.from({ length: 24 }, (_, i) => {
    const pathId = `sql-path-${baseId}-${position > 0 ? "pos" : "neg"}-${i}`;
    const sql = SQL_SNIPPETS[i % SQL_SNIPPETS.length];
    
    // Curved Bezier geometry adapted from original floating paths
    const d = `M-${380 - i * 7 * position} -${160 + i * 8}C-${
      380 - i * 7 * position
    } -${160 + i * 8} -${290 - i * 7 * position} ${220 - i * 7} ${
      160 - i * 7 * position
    } ${350 - i * 7}C${600 - i * 7 * position} ${480 - i * 7} ${
      690 - i * 7 * position
    } ${880 - i * 7} ${690 - i * 7 * position} ${880 - i * 7}`;

    const duration = 22 + (i % 6) * 4;
    const opacity = 0.2 + (i % 5) * 0.12;

    return {
      id: pathId,
      index: i,
      d,
      sql,
      duration,
      opacity,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <svg
        className="w-full h-full text-slate-400 dark:text-cyan-400/40"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Flowing SQL Query Paths</title>
        <defs>
          {paths.map((path) => (
            <path key={`def-${path.id}`} id={path.id} d={path.d} fill="none" />
          ))}
        </defs>

        {/* Faint ambient guide traces */}
        {paths.map((path) => (
          <path
            key={`guide-${path.id}`}
            d={path.d}
            stroke="currentColor"
            strokeWidth="0.4"
            strokeOpacity={0.07}
            strokeDasharray="4 8"
          />
        ))}

        {/* Flowing SQL queries moving along the curved paths */}
        {paths.map((path) => (
          <text
            key={`text-${path.id}`}
            className="font-mono text-[7px] tracking-widest uppercase fill-slate-700 dark:fill-cyan-300/70 font-semibold"
            style={{
              opacity: path.opacity,
              filter: path.index % 3 === 0 ? "drop-shadow(0 0 6px rgba(56,189,248,0.35))" : undefined,
            }}
          >
            <motion.textPath
              href={`#${path.id}`}
              startOffset={position > 0 ? "0%" : "100%"}
              animate={{
                startOffset: position > 0 ? ["-35%", "105%"] : ["105%", "-35%"],
              }}
              transition={{
                duration: path.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {path.sql} ••• {path.sql}
            </motion.textPath>
          </text>
        ))}
      </svg>
    </div>
  );
}

export interface BackgroundPathsProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  actionText?: string;
  onActionClick?: () => void;
  secondaryActionText?: string;
  onSecondaryActionClick?: () => void;
  className?: string;
}

export function BackgroundPaths({
  title = "Agentic SQL Analytics",
  subtitle = "Query your relational databases in plain English. Powered by AI query planning, schema inspection, and real-time execution safety.",
  badgeText = "Next-Gen Data Intelligence",
  actionText = "Launch Workspace",
  onActionClick,
  secondaryActionText = "Explore Schema & Connections",
  onSecondaryActionClick,
  className = "",
}: BackgroundPathsProps) {
  const words = title.split(" ");

  return (
    <div
      className={`relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden bg-neutral-950 text-white ${className}`}
    >
      {/* Background flowing SQL stream paths */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Radial soft glow backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(14,165,233,0.12),transparent_70%)]" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {badgeText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 mb-6 backdrop-blur-md shadow-inner"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {badgeText}
            </motion.div>
          )}

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tight leading-none">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-3 sm:mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.08 + letterIndex * 0.02,
                      type: "spring",
                      stiffness: 160,
                      damping: 24,
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed font-normal"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Action Button cluster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            <div
              className="inline-block group relative bg-gradient-to-b from-cyan-500/30 to-white/10 
              p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-xl hover:shadow-cyan-500/20 
              transition-shadow duration-300"
            >
              <Button
                variant="ghost"
                onClick={onActionClick}
                className="rounded-[1.15rem] px-8 py-6 text-base sm:text-lg font-semibold backdrop-blur-md 
                bg-neutral-900/90 hover:bg-neutral-800/90 text-white transition-all duration-300 
                group-hover:-translate-y-0.5 border border-cyan-500/20 hover:border-cyan-400/40
                shadow-lg hover:shadow-cyan-950/50"
              >
                <span className="opacity-95 group-hover:opacity-100 transition-opacity">
                  {actionText}
                </span>
                <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                  →
                </span>
              </Button>
            </div>

            {secondaryActionText && (
              <Button
                variant="outline"
                onClick={onSecondaryActionClick}
                className="rounded-[1.15rem] px-6 py-6 text-base font-medium border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 hover:text-white transition-all backdrop-blur-md"
              >
                {secondaryActionText}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
