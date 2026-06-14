import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Download, Check
} from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * Table — Upgraded data table with bulk selection, ellipsis pagination, row count, and export slot
 *
 * Props:
 *   headers       Array<{ key, label, sortable?, render?, width? }>
 *   data          Array<object>
 *   loading       boolean
 *   actions       (row) => ReactNode
 *   emptyMessage  string
 *   emptyIcon     LucideIcon
 *   emptyAction   { label, onClick }
 *   pagination    { currentPage, totalPages, total, onPageChange, limit, onLimitChange }
 *   onSort        (key, direction) => void
 *   selectable    boolean  — enable row checkboxes
 *   onSelectionChange (selectedIds) => void
 *   toolbar       ReactNode — slot for search/filters above table
 *   exportSlot    ReactNode — slot for export button
 */
const Table = ({
  headers = [],
  data = [],
  loading = false,
  actions = null,
  emptyMessage = 'No records found.',
  emptyIcon,
  emptyAction,
  pagination = null,
  onSort = null,
  selectable = false,
  onSelectionChange,
  toolbar,
  exportSlot,
}) => {
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSortClick = (key) => {
    if (!onSort) return;
    const nextDir = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(nextDir);
    onSort(key, nextDir);
  };

  const toggleRow = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map((r, i) => r.id ?? i));
      setSelectedIds(all);
      onSelectionChange?.(Array.from(all));
    }
  };

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Ellipsis pagination builder
  const buildPages = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', total);
    } else if (current >= total - 3) {
      pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '…', current - 1, current, current + 1, '…', total);
    }
    return pages;
  };

  const colCount = headers.length + (actions ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Toolbar slot */}
      {toolbar && <div>{toolbar}</div>}

      {/* Bulk selection bar */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-brand/10 border border-brand/25 animate-fadeIn">
          <span className="text-sm font-semibold text-brand-light">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-4 bg-brand/30" />
          <div className="flex items-center gap-2 flex-1">{/* Bulk actions injected via children */}</div>
          <button
            onClick={() => { setSelectedIds(new Set()); onSelectionChange?.([]); }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-700/50"
        style={{ background: 'rgba(30,41,59,0.65)', backdropFilter: 'blur(12px)' }}
      >
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/40">
              {selectable && (
                <th className="w-10 py-3.5 px-4">
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-brand border-brand'
                        : someSelected
                        ? 'bg-brand/50 border-brand/60'
                        : 'border-slate-600 hover:border-slate-400'
                    }`}
                    aria-label="Select all"
                  >
                    {(allSelected || someSelected) && <Check size={10} className="text-white" strokeWidth={3} />}
                  </button>
                </th>
              )}
              {headers.map((header) => (
                <th
                  key={header.key}
                  style={header.width ? { width: header.width } : undefined}
                  className={`py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider select-none ${
                    header.sortable && onSort ? 'cursor-pointer hover:text-white transition-colors' : ''
                  }`}
                  onClick={() => header.sortable && handleSortClick(header.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{header.label}</span>
                    {header.sortable && onSort && (
                      <div className="flex flex-col text-slate-600">
                        <ChevronUp
                          size={11}
                          className={`-mb-0.5 ${sortKey === header.key && sortDirection === 'asc' ? 'text-brand-light' : ''}`}
                        />
                        <ChevronDown
                          size={11}
                          className={`${sortKey === header.key && sortDirection === 'desc' ? 'text-brand-light' : ''}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {selectable && (
                    <td className="py-4 px-4">
                      <div className="w-4 h-4 bg-slate-700/50 rounded" />
                    </td>
                  )}
                  {headers.map((_, hIdx) => (
                    <td key={hIdx} className="py-4 px-4">
                      <div className="h-3.5 bg-slate-700/50 rounded" style={{ width: `${40 + (hIdx * 17) % 40}%` }} />
                    </td>
                  ))}
                  {actions && (
                    <td className="py-4 px-4 text-right">
                      <div className="h-3.5 bg-slate-700/50 rounded w-14 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyMessage}
                    action={emptyAction}
                    compact
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const rowId = row.id ?? rIdx;
                const isSelected = selectedIds.has(rowId);
                return (
                  <tr
                    key={rowId}
                    className={`transition-colors duration-100 ${
                      isSelected
                        ? 'bg-brand/5 hover:bg-brand/8'
                        : rIdx % 2 === 0
                        ? 'hover:bg-slate-800/25'
                        : 'bg-slate-800/5 hover:bg-slate-800/25'
                    }`}
                  >
                    {selectable && (
                      <td className="py-3.5 px-4 w-10">
                        <button
                          onClick={() => toggleRow(rowId)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-brand border-brand'
                              : 'border-slate-600 hover:border-slate-400'
                          }`}
                          aria-label={`Select row ${rIdx + 1}`}
                        >
                          {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </button>
                      </td>
                    )}
                    {headers.map((header) => (
                      <td key={header.key} className="py-3.5 px-4 text-sm text-slate-300">
                        {header.render ? header.render(row) : row[header.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination */}
      {pagination && !loading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
          {/* Left: row count + limit selector */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span>Show</span>
            <select
              value={pagination.limit || 10}
              onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/60 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand/50 transition-colors"
            >
              {[5, 10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>per page</span>

            {pagination.total != null && (
              <>
                <span className="text-slate-700 mx-1">·</span>
                <span className="text-slate-400">
                  {((pagination.currentPage - 1) * (pagination.limit || 10)) + 1}–
                  {Math.min(pagination.currentPage * (pagination.limit || 10), pagination.total)} of{' '}
                  <strong className="text-slate-300">{pagination.total}</strong>
                </span>
              </>
            )}
          </div>

          {/* Right: page buttons */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>

              {buildPages(pagination.currentPage, pagination.totalPages).map((page, idx) =>
                page === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-600 text-xs select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => pagination.onPageChange(page)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                      pagination.currentPage === page
                        ? 'bg-brand text-white shadow-sm shadow-brand/30'
                        : 'border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Table;
