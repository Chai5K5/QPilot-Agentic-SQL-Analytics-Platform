"use client";

import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SQL_SNIPPETS = [
  "SELECT category, SUM(revenue) AS rev FROM orders WHERE status = 'completed' GROUP BY 1;",
  "SELECT c.name, COUNT(o.id) FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY 1;",
  "SELECT DATE_TRUNC('month', created_at), AVG(amount) FROM transactions GROUP BY 1;",
  "WITH top_metrics AS (SELECT id, revenue FROM analytics_warehouse) SELECT * FROM top_metrics;",
  "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE schema = 'public';",
  "SELECT status, count(*) FROM query_jobs WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY 1;",
];

export function FloatingPaths({ position }: { position: number }) {
  const baseId = useId().replace(/:/g, "_");

  // Optimized: 6 well-spaced paths per side instead of 24 (cuts glyph recalculations by 75%)
  const paths = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const pathId = `sql-p-${baseId}-${position > 0 ? "r" : "l"}-${i}`;
      const sql = SQL_SNIPPETS[i % SQL_SNIPPETS.length];

      // Geometry with graceful curves across the viewport
      const d = `M-${380 - i * 35 * position} -${150 + i * 30}C-${
        380 - i * 35 * position
      } -${150 + i * 30} -${260 - i * 35 * position} ${220 - i * 25} ${
        180 - i * 35 * position
      } ${340 - i * 25}C${560 - i * 35 * position} ${460 - i * 25} ${
        690 - i * 35 * position
      } ${860 - i * 25} ${690 - i * 35 * position} ${860 - i * 25}`;

      const duration = 24 + i * 4;
      const opacity = 0.25 + (i % 3) * 0.15;

      return {
        id: pathId,
        d,
        sql,
        duration,
        opacity,
      };
    });
  }, [baseId, position]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <svg
        className="w-full h-full text-slate-400 dark:text-cyan-400/40"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        textRendering="optimizeSpeed"
        shapeRendering="optimizeSpeed"
      >
        <title>Flowing SQL Query Paths</title>
        <defs>
          {paths.map((path) => (
            <path key={`def-${path.id}`} id={path.id} d={path.d} fill="none" />
          ))}
        </defs>

        {/* Static subtle guide traces */}
        {paths.map((path) => (
          <path
            key={`guide-${path.id}`}
            d={path.d}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity={0.06}
            strokeDasharray="3 6"
          />
        ))}

        {/* Lightweight flowing SQL text without expensive drop-shadow filters */}
        {paths.map((path) => (
          <text
            key={`text-${path.id}`}
            className="font-mono text-[8px] tracking-wider uppercase fill-slate-600 dark:fill-cyan-300/80 font-medium"
            style={{ opacity: path.opacity }}
          >
            <motion.textPath
              href={`#${path.id}`}
              startOffset={position > 0 ? "0%" : "100%"}
              animate={{
                startOffset: position > 0 ? ["-25%", "105%"] : ["105%", "-25%"],
              }}
              transition={{
                duration: path.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {path.sql}
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
  const words = useMemo(() => title.split(" "), [title]);

  return (
    <div
      className={`relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden bg-neutral-950 text-white ${className}`}
    >
      {/* Background flowing SQL stream paths */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Radial soft glow backdrop (Hardware accelerated GPU layer) */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(14,165,233,0.12),transparent_70%)]" 
        style={{ transform: "translateZ(0)" }}
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {badgeText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 mb-6 backdrop-blur-md shadow-inner"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {badgeText}
            </motion.div>
          )}

          {/* Optimized Word-level spring animation (smoother than 30 individual letter springs) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tight leading-none">
            {words.map((word, wordIndex) => (
              <motion.span
                key={wordIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: wordIndex * 0.08,
                  type: "spring",
                  stiffness: 140,
                  damping: 20,
                }}
                className="inline-block mr-3 sm:mr-4 last:mr-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed font-normal"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Action Button cluster */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
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
