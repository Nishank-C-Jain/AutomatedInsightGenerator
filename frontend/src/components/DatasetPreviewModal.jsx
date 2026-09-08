import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Database, AlertTriangle } from 'lucide-react';
import { fetchDatasetPreview } from '../api/services.js';

/* ─────────────────────────── constants ─────────────────────────── */
const PAGE_SIZE = 25;

const TYPE_COLORS = {
  integer:  { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)',  text: '#818cf8' },
  float:    { bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.3)',   text: '#38bdf8' },
  text:     { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',   text: '#34d399' },
  datetime: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',   text: '#fbbf24' },
  boolean:  { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)',   text: '#f472b6' },
  default:  { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)', text: '#9ca3af' },
};

function typeBadgeStyle(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

/* ─────────────────────────── sub-components ─────────────────────── */

function SortIcon({ col, sortState }) {
  if (sortState.col !== col) return <ChevronsUpDown size={13} style={{ color: '#6b7280', flexShrink: 0 }} />;
  return sortState.dir === 'asc'
    ? <ChevronUp   size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
    : <ChevronDown size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />;
}

function Skeleton() {
  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

function MissingBadge({ pct }) {
  if (pct === 0) return null;
  const color = pct > 20 ? '#f87171' : pct > 5 ? '#fbbf24' : '#9ca3af';
  return (
    <span style={{ fontSize: '10px', fontWeight: '600', color, marginLeft: '6px' }}>
      {pct}% missing
    </span>
  );
}

/* ─────────────────────────── main component ─────────────────────── */

export default function DatasetPreviewModal({ datasetId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState({ col: null, dir: 'asc' });
  const [page, setPage]       = useState(1);
  const [rowLimit, setRowLimit] = useState(50);

  /* load preview data */
  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError('');
    fetchDatasetPreview(datasetId, rowLimit)
      .then(res => { if (res.success) setData(res); else setError(res.message || 'Failed to load preview'); })
      .catch(err => setError(err?.response?.data?.message || err.message || 'Failed to load preview'))
      .finally(() => setLoading(false));
  }, [datasetId, rowLimit]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* column names */
  const colNames = useMemo(() => data?.columns?.map(c => c.name) ?? [], [data]);

  /* filter + sort rows (client-side) */
  const processedRows = useMemo(() => {
    if (!data?.rows) return [];
    let rows = data.rows;

    // global text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(row =>
        Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q))
      );
    }

    // sort
    if (sort.col) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.col]; const bv = b[sort.col];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, sort]);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = processedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = useCallback((col) => {
    setSort(prev => prev.col === col
      ? prev.dir === 'asc' ? { col, dir: 'desc' } : { col: null, dir: 'asc' }
      : { col, dir: 'asc' }
    );
    setPage(1);
  }, []);

  const handleSearch = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);

  /* cell formatting */
  const formatCell = (val) => {
    if (val == null) return <span style={{ color: '#4b5563', fontStyle: 'italic' }}>null</span>;
    if (typeof val === 'boolean') return <span style={{ color: val ? '#34d399' : '#f87171' }}>{String(val)}</span>;
    return String(val);
  };

  /* ── render ── */
  return (
    <div
      className="preview-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="preview-modal">

        {/* ── Modal header ── */}
        <div className="preview-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={18} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {data?.dataset_name || 'Dataset Preview'}
              </div>
              {data && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {data.total_rows.toLocaleString()} rows · {data.total_cols} columns
                  {data.total_rows > rowLimit && (
                    <span style={{ color: '#fbbf24', marginLeft: '8px' }}>
                      (showing first {rowLimit})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button className="preview-close-btn" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>

        {/* ── Column metadata strip ── */}
        {data?.columns && (
          <div className="preview-col-strip">
            {data.columns.map(col => {
              const style = typeBadgeStyle(col.type);
              return (
                <div key={col.name} className="preview-col-chip" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: style.text }}>{col.type}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>{col.name}</span>
                  <MissingBadge pct={col.missing_pct} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="preview-toolbar">
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="preview-search"
              placeholder="Search all columns…"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Load:</span>
            {[50, 100].map(n => (
              <button
                key={n}
                onClick={() => { setRowLimit(n); setPage(1); }}
                className={`preview-limit-btn${rowLimit === n ? ' active' : ''}`}
              >
                {n} rows
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="preview-table-wrap">
          {loading && <Skeleton />}

          {!loading && error && (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#fca5a5' }}>
              <AlertTriangle size={28} />
              <p style={{ fontSize: '14px', textAlign: 'center' }}>{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <table className="preview-table">
              <thead>
                <tr>
                  <th className="preview-th preview-th-idx">#</th>
                  {colNames.map(col => (
                    <th
                      key={col}
                      className="preview-th preview-th-sortable"
                      onClick={() => handleSort(col)}
                    >
                      <span className="preview-th-inner">
                        {col}
                        <SortIcon col={col} sortState={sort} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={colNames.length + 1} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      No rows match your search.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, i) => (
                    <tr key={i} className={`preview-tr${i % 2 === 0 ? '' : ' preview-tr-alt'}`}>
                      <td className="preview-td preview-td-idx">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                      {colNames.map(col => (
                        <td key={col} className="preview-td">{formatCell(row[col])}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && processedRows.length > PAGE_SIZE && (
          <div className="preview-pagination">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, processedRows.length)} of {processedRows.length} rows
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="preview-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={14} /></button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
                  return (
                    <button key={p} className={`preview-page-btn${p === safePage ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  );
                }
                if (p === 2 || p === totalPages - 1) return <span key={p} style={{ color: 'var(--text-muted)', alignSelf: 'center', padding: '0 2px' }}>…</span>;
                return null;
              })}
              <button className="preview-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
