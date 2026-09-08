import React, { useState, useRef, useEffect } from 'react';
import { exportPDF } from '../utils/exportPDF';
import { exportExcel, exportCSV } from '../utils/exportExcel';

export default function ExportMenu({ analysisData, datasetName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | 'csv' | null
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPDF = async () => {
    if (!analysisData) return;
    setExporting('pdf');
    try {
      // Small timeout to allow UI update
      await new Promise((res) => setTimeout(res, 50));
      exportPDF(analysisData, datasetName || 'dataset');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF report: ' + (err.message || err));
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const handleExportExcel = async () => {
    if (!analysisData) return;
    setExporting('excel');
    try {
      await new Promise((res) => setTimeout(res, 50));
      exportExcel(analysisData, datasetName || 'dataset');
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Failed to generate Excel file: ' + (err.message || err));
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const handleExportCSV = async () => {
    if (!analysisData) return;
    setExporting('csv');
    try {
      await new Promise((res) => setTimeout(res, 50));
      exportCSV(analysisData, datasetName || 'dataset');
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to generate CSV file: ' + (err.message || err));
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const isDisabled = !analysisData;

  return (
    <div className="export-menu-container" ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-secondary export-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled || !!exporting}
        title={isDisabled ? 'No analysis data available to export' : 'Export Analysis Report'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontWeight: 500,
          borderRadius: '8px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {exporting ? `Generating ${exporting.toUpperCase()}...` : 'Export Report'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div
          className="export-dropdown-menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            width: '240px',
            zIndex: 1000,
            overflow: 'hidden',
            padding: '6px',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Available Formats
          </div>

          {/* PDF Option */}
          <button
            onClick={handleExportPDF}
            disabled={!!exporting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>PDF Document (.pdf)</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Comprehensive visual report</div>
            </div>
          </button>

          {/* Excel Option */}
          <button
            onClick={handleExportExcel}
            disabled={!!exporting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Excel Workbook (.xlsx)</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Multi-tab structured data</div>
            </div>
          </button>

          {/* CSV Option */}
          <button
            onClick={handleExportCSV}
            disabled={!!exporting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M8 13h2a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1H8v4"/>
                <path d="M14 10h3v4h-3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>CSV Summary (.csv)</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Flat table key statistics</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
