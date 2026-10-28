import React, { useState } from "react";
import { 
  Table, 
  Download, 
  Search, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Database
} from "lucide-react";

interface ResultsTableProps {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
}

export function ResultsTable({
  columns,
  rows,
  rowCount,
}: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [copied, setCopied] = useState(false);

  // Filter rows based on search
  const filteredRows = rows.filter((row) =>
    columns.some((col) => {
      const val = row[col];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-500">
          NULL
        </span>
      );
    }
    if (typeof val === "number") {
      // If it looks like a currency or float with decimals
      return val.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    }
    if (typeof val === "boolean") {
      return val ? "TRUE" : "FALSE";
    }
    return String(val);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const headerLine = columns.join(",");
    const rowLines = rows.map((r) =>
      columns
        .map((c) => {
          const val = r[c] === null || r[c] === undefined ? "" : String(r[c]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headerLine, ...rowLines].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qpilot_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (rowCount === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center shadow-md">
        <Database className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-neutral-300">No Rows Returned</h4>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          The query completed successfully, but 0 matching records satisfied the query filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
      {/* Table toolbar */}
      <div className="px-4 py-3 bg-neutral-950/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Database Query Results</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
            {rowCount} {rowCount === 1 ? "row" : "rows"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick search in results */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-2.5 py-1 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
            />
          </div>

          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
            title="Copy as JSON"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
            title="Download CSV"
          >
            <Download className="w-3 h-3 text-neutral-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950 text-neutral-400 font-mono border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-3 w-10 text-neutral-600 font-normal">#</th>
              {columns.map((col) => (
                <th key={col} className="py-2.5 px-4 font-semibold text-neutral-300 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80 font-mono">
            {paginatedRows.map((row, rIdx) => {
              const rowIndex = (page - 1) * pageSize + rIdx + 1;
              return (
                <tr key={rIdx} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-neutral-600 text-[11px]">{rowIndex}</td>
                  {columns.map((col) => (
                    <td key={col} className="py-2.5 px-4 text-neutral-200 whitespace-nowrap">
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRows.length)} of{" "}
            {filteredRows.length} results
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
