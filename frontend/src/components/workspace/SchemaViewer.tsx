import React, { useState } from "react";
import { TableSchema } from "@/types";
import { 
  Layers, 
  Search, 
  Key, 
  Link2, 
  Table, 
  Sparkles,
  Info
} from "lucide-react";

interface SchemaViewerProps {
  schemas: TableSchema[];
  onSelectTableForQuery: (tableName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SchemaViewer({
  schemas,
  onSelectTableForQuery,
  isOpen,
  onClose,
}: SchemaViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableSchema>(schemas[0] || null);

  if (!isOpen) return null;

  const filteredSchemas = schemas.filter((table) => {
    const tableMatch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const colMatch = table.columns.some((col) =>
      col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return tableMatch || colMatch;
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl transition-all">
      {/* Header */}
      <div className="px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Database Schema Inspector</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            {schemas.length} Tables Loaded
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800"
        >
          Close Inspector ✕
        </button>
      </div>

      {/* Backend Status Notice */}
      <div className="bg-cyan-950/20 border-b border-cyan-900/40 px-4 py-2 flex items-center gap-2 text-xs text-cyan-300">
        <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        <span>
          Schema metadata mapped for connected PostgreSQL database. Backend schema inspection is integrated with <code className="text-cyan-200">DatabaseManager.get_schema()</code>.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        {/* Table List (Left column) */}
        <div className="md:col-span-4 p-3 space-y-2 bg-neutral-950/50">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search tables or columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {filteredSchemas.map((table) => {
              const isSelected = selectedTable?.name === table.name;
              return (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-neutral-800 text-white border border-neutral-700"
                      : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-neutral-500"}`} />
                    <span className="font-mono font-medium">{table.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {table.columns.length} cols
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column Details (Right column) */}
        <div className="md:col-span-8 p-4">
          {selectedTable ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-sm font-bold text-white">
                      {selectedTable.name}
                    </h4>
                    {selectedTable.rowCountEstimate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        ~{selectedTable.rowCountEstimate.toLocaleString()} rows
                      </span>
                    )}
                  </div>
                  {selectedTable.description && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {selectedTable.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onSelectTableForQuery(selectedTable.name)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask about this table
                </button>
              </div>

              {/* Columns Table */}
              <div className="border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono border-b border-neutral-800">
                    <tr>
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Data Type</th>
                      <th className="py-2 px-3">Constraints</th>
                      <th className="py-2 px-3">Nullable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 font-mono">
                    {selectedTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-neutral-800/30">
                        <td className="py-2 px-3 text-white font-medium flex items-center gap-1.5">
                          {col.isPrimaryKey && (
                            <Key className="w-3 h-3 text-amber-400" title="Primary Key" />
                          )}
                          {col.isForeignKey && (
                            <Link2 className="w-3 h-3 text-blue-400" title="Foreign Key" />
                          )}
                          <span>{col.name}</span>
                        </td>
                        <td className="py-2 px-3 text-cyan-400">
                          {col.type}
                        </td>
                        <td className="py-2 px-3 text-neutral-400 text-[11px]">
                          {col.isPrimaryKey && (
                            <span className="text-amber-400 font-semibold mr-1">PK</span>
                          )}
                          {col.references && (
                            <span className="text-blue-300">
                              FK → {col.references}
                            </span>
                          )}
                          {!col.isPrimaryKey && !col.references && "—"}
                        </td>
                        <td className="py-2 px-3">
                          {col.nullable ? (
                            <span className="text-neutral-500">YES</span>
                          ) : (
                            <span className="text-neutral-400 font-semibold">NOT NULL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500 text-xs">
              Select a table from the list to view its columns and keys.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
