import React, { useState } from "react";
import { BarChart3 } from "lucide-react";

interface ResultsChartProps {
  columns: string[];
  rows: Record<string, any>[];
}

export function ResultsChart({ columns, rows }: ResultsChartProps) {
  const numericColumns = columns.filter((col) => {
    return rows.some((r) => typeof r[col] === "number");
  });

  const labelColumns = columns.filter((col) => {
    return rows.some((r) => typeof r[col] === "string");
  });

  const labelCol = labelColumns[0] || columns[0];
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  if (rows.length === 0) return null;

  const activeMetric = selectedMetric || numericColumns[numericColumns.length - 1] || numericColumns[0] || "";

  if (!activeMetric) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-center text-xs text-neutral-400">
        No numeric metrics available in this result set for chart visualization.
      </div>
    );
  }

  // Find max value for scaling
  const values = rows.map((r) => Number(r[activeMetric]) || 0);
  const maxValue = Math.max(...values, 1);
  const sumValue = values.reduce((acc, curr) => acc + curr, 0);
  const avgValue = values.length > 0 ? sumValue / values.length : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">
            Analytical Visualization
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            (Calculated from {rows.length} records)
          </span>
        </div>

        {numericColumns.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 font-mono text-[11px]">Metric:</span>
            <select
              value={activeMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
            >
              {numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-neutral-950/70 border border-neutral-800/80 p-2.5 rounded-lg">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Total Sum</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            {sumValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-neutral-950/70 border border-neutral-800/80 p-2.5 rounded-lg">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Average</div>
          <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
            {avgValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-neutral-950/70 border border-neutral-800/80 p-2.5 rounded-lg">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Max Value</div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {maxValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-neutral-950/70 border border-neutral-800/80 p-2.5 rounded-lg">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Data Points</div>
          <div className="text-sm font-bold text-neutral-300 font-mono mt-0.5">
            {rows.length}
          </div>
        </div>
      </div>

      {/* SVG Responsive Bar Chart */}
      <div className="pt-2">
        <div className="space-y-2.5">
          {rows.map((row, idx) => {
            const label = String(row[labelCol] || `Item ${idx + 1}`);
            const val = Number(row[activeMetric]) || 0;
            const pct = Math.max(Math.min((val / maxValue) * 100, 100), 2);

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300 truncate max-w-[220px]" title={label}>
                    {label}
                  </span>
                  <span className="text-cyan-300 font-semibold">
                    {val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Visual bar container */}
                <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
