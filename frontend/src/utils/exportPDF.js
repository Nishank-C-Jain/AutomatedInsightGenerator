/**
 * exportPDF.js
 * Generates a full-featured PDF analysis report using jsPDF + jspdf-autotable.
 * All rendering is client-side — no server required.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── design tokens ─── */
const C = {
  bg:        [15, 14, 26],    // #0f0e1a
  accent:    [139, 92, 246],  // #8b5cf6
  accentLt:  [196, 181, 253], // #c4b5fd
  white:     [243, 244, 246], // #f3f4f6
  muted:     [107, 114, 128], // #6b7280
  success:   [16, 185, 129],  // #10b981
  danger:    [239, 68, 68],   // #ef4444
  warning:   [245, 158, 11],  // #f59e0b
  info:      [99, 102, 241],  // #6366f1
  border:    [30, 28, 48],    // slightly lighter than bg
};

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

/* ─── helpers ─── */
const safe = (v) => (v == null || v === '' ? '—' : String(v));
const pct  = (v) => v == null ? '—' : `${Number(v).toFixed(1)}%`;
const num  = (v) => v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 3 });

function drawPageHeader(doc, title, pageNum) {
  // dark header bar
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, 16, 'F');
  // accent left strip
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 3, 16, 'F');
  // title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.accentLt);
  doc.text('INSIGHTFLOW  ·  ANALYTICS REPORT', MARGIN, 10);
  // section name
  doc.setTextColor(...C.muted);
  doc.text(title.toUpperCase(), PAGE_W / 2, 10, { align: 'center' });
  // page number
  doc.text(`PAGE ${pageNum}`, PAGE_W - MARGIN, 10, { align: 'right' });
  // separator
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 17, PAGE_W - MARGIN, 17);
}

function drawSectionTitle(doc, text, y) {
  doc.setFillColor(...C.accent);
  doc.rect(MARGIN, y, 3, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(text, MARGIN + 6, y + 4);
  return y + 10;
}

function drawBody(doc, text, y, maxWidth = CONTENT_W) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  const lines = doc.splitTextToSize(String(text), maxWidth);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 4.5;
}

function tableDefaults(doc, pageNum) {
  return {
    theme: 'grid',
    startY: undefined,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: C.accent,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fillColor: [18, 17, 30],
      textColor: C.white,
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: C.border },
    didDrawPage: () => drawPageHeader(doc, '', pageNum),
  };
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT FUNCTION
═══════════════════════════════════════════════════════ */
export function exportToPDF(analysisData, datasetName = 'Dataset') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fileName = `report_${datasetName.replace(/\s+/g, '_')}_${now.toISOString().slice(0,10)}.pdf`;

  let pageNum = 0;

  /* ── COVER PAGE ── */
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  // accent bar top
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE_W, 6, 'F');
  // branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...C.white);
  doc.text('InsightFlow', PAGE_W / 2, 70, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(...C.accentLt);
  doc.text('AUTOMATED ANALYTICS REPORT', PAGE_W / 2, 82, { align: 'center' });
  // divider
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 20, 88, PAGE_W - MARGIN - 20, 88);
  // dataset name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...C.white);
  doc.text(datasetName, PAGE_W / 2, 100, { align: 'center' });
  // meta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  const dq = analysisData.data_quality;
  const metaLines = [
    `Generated: ${dateStr}`,
    `Rows: ${num(dq?.row_count ?? '—')}   ·   Columns: ${num(dq?.column_count ?? '—')}`,
    `Quality Score: ${num(dq?.quality_score ?? '—')} / 100`,
  ];
  metaLines.forEach((line, i) => {
    doc.text(line, PAGE_W / 2, 114 + i * 7, { align: 'center' });
  });
  // footer
  doc.setFillColor(...C.accent);
  doc.rect(0, PAGE_H - 6, PAGE_W, 6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.white);
  doc.text('Confidential · InsightFlow Analytics Engine', PAGE_W / 2, PAGE_H - 2, { align: 'center' });

  /* ── SECTION 1: DATA QUALITY ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Data Quality', pageNum);
  let y = 26;
  y = drawSectionTitle(doc, '1. Data Quality', y);

  if (dq) {
    // summary chips
    const chips = [
      { label: 'Quality Score', val: `${num(dq.quality_score)} / 100`, color: C.success },
      { label: 'Missing Values', val: pct(dq.missing_percentage), color: C.warning },
      { label: 'Duplicates', val: safe(dq.duplicates?.duplicate_count), color: C.info },
      { label: 'Outliers', val: safe(dq.outliers?.total_outliers), color: C.danger },
    ];
    chips.forEach((chip, i) => {
      const cx = MARGIN + (i % 2) * (CONTENT_W / 2 + 2);
      const cy = y + Math.floor(i / 2) * 16;
      doc.setFillColor(...C.border);
      doc.roundedRect(cx, cy, CONTENT_W / 2 - 2, 12, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...chip.color);
      doc.text(chip.val, cx + 6, cy + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      doc.text(chip.label.toUpperCase(), cx + 6, cy + 11.5);
    });
    y += 36;

    // missing values table
    const mv = dq.missing_values;
    if (Array.isArray(mv) && mv.length > 0) {
      y = drawSectionTitle(doc, 'Missing Values per Column', y);
      autoTable(doc, {
        ...tableDefaults(doc, pageNum),
        startY: y,
        head: [['Column', 'Missing Count', 'Missing %']],
        body: mv.map(r => [safe(r.column), safe(r.missing_count), pct(r.missing_percentage)]),
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  }

  /* ── SECTION 2: KPIs ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'KPIs', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '2. Key Performance Indicators', y);

  const kpis = analysisData.kpis;
  if (kpis && typeof kpis === 'object' && !kpis.message) {
    const kpiRows = Object.entries(kpis).flatMap(([col, metrics]) =>
      typeof metrics === 'object' ? [[col, num(metrics.sum), num(metrics.mean), num(metrics.max), num(metrics.min)]] : []
    );
    if (kpiRows.length > 0) {
      autoTable(doc, {
        ...tableDefaults(doc, pageNum),
        startY: y,
        head: [['Column', 'Sum', 'Mean', 'Max', 'Min']],
        body: kpiRows,
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  } else {
    y = drawBody(doc, 'No numeric KPIs available for this dataset.', y);
  }

  /* ── SECTION 3: STATISTICS ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Statistics', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '3. Descriptive Statistics', y);

  const stats = analysisData.statistics;
  if (stats) {
    const numeric = stats.numeric_stats || stats.numerical || [];
    if (Array.isArray(numeric) && numeric.length > 0) {
      y = drawSectionTitle(doc, 'Numeric Columns', y);
      autoTable(doc, {
        ...tableDefaults(doc, pageNum),
        startY: y,
        head: [['Column', 'Mean', 'Std Dev', 'Min', 'Max', 'Median']],
        body: numeric.map(r => [
          safe(r.column || r.name),
          num(r.mean), num(r.std || r.std_dev),
          num(r.min), num(r.max), num(r.median || r['50%']),
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    }
    const categorical = stats.categorical_stats || stats.categorical || [];
    if (Array.isArray(categorical) && categorical.length > 0) {
      y = drawSectionTitle(doc, 'Categorical Columns', y);
      autoTable(doc, {
        ...tableDefaults(doc, pageNum),
        startY: y,
        head: [['Column', 'Unique Values', 'Top Value', 'Top Frequency']],
        body: categorical.map(r => [
          safe(r.column || r.name),
          safe(r.unique_count || r.unique),
          safe(r.top || r.mode),
          safe(r.top_frequency || r.freq),
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  }

  /* ── SECTION 4: TRENDS & FORECASTING ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Trends & Forecasting', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '4. Trends', y);

  const trends = analysisData.trends;
  if (trends && !trends.message) {
    const trendRows = [
      ['Column', safe(trends.value_column)],
      ['Slope', num(trends.slope)],
      ['Intercept', num(trends.intercept)],
      ['R² Score', num(trends.r2_score)],
      ['Direction', safe(trends.trend_direction)],
      ['Strength', safe(trends.trend_strength)],
    ];
    autoTable(doc, {
      ...tableDefaults(doc, pageNum),
      startY: y,
      head: [['Metric', 'Value']],
      body: trendRows,
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    y = drawBody(doc, trends?.message || 'No trend data available.', y);
    y += 6;
  }

  y = drawSectionTitle(doc, '5. Forecasting', y);
  const forecast = analysisData.forecasting;
  if (forecast && !forecast.message && Array.isArray(forecast.forecast_values)) {
    autoTable(doc, {
      ...tableDefaults(doc, pageNum),
      startY: y,
      head: [['Step', 'Forecasted Value']],
      body: forecast.forecast_values.map((v, i) => [`Step ${i + 1}`, num(v)]),
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    y = drawBody(doc, forecast?.message || 'No forecast data available.', y);
  }

  /* ── SECTION 5: ANOMALIES ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Anomalies', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '6. Anomaly Detection', y);

  const anomalies = analysisData.anomalies;
  if (anomalies && typeof anomalies === 'object' && !anomalies.message) {
    const anomRows = Object.entries(anomalies)
      .filter(([, v]) => typeof v === 'object')
      .map(([col, v]) => [
        col,
        safe(v.anomaly_count),
        pct(v.anomaly_percentage),
        safe(v.method || 'Z-Score'),
        safe(v.threshold),
      ]);
    if (anomRows.length > 0) {
      autoTable(doc, {
        ...tableDefaults(doc, pageNum),
        startY: y,
        head: [['Column', 'Anomaly Count', 'Anomaly %', 'Method', 'Threshold']],
        body: anomRows,
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  } else {
    y = drawBody(doc, anomalies?.message || 'No anomaly data.', y);
  }

  /* ── SECTION 6: CORRELATIONS ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Correlations', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '7. Correlations', y);

  const corr = analysisData.correlations;
  const strongPairs = corr?.strong_pairs || corr?.strong_correlations || [];
  if (Array.isArray(strongPairs) && strongPairs.length > 0) {
    autoTable(doc, {
      ...tableDefaults(doc, pageNum),
      startY: y,
      head: [['Column A', 'Column B', 'Correlation', 'Strength']],
      body: strongPairs.map(p => [
        safe(p.column_a || p.col1 || p.feature1),
        safe(p.column_b || p.col2 || p.feature2),
        num(p.correlation || p.value),
        safe(p.strength || (Math.abs(p.correlation) > 0.7 ? 'Strong' : 'Moderate')),
      ]),
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    y = drawBody(doc, 'No strong correlations detected.', y);
  }

  /* ── SECTION 7: AUTOMATED INSIGHTS ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Automated Insights', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '8. Automated Insights', y);

  const insights = analysisData.insights;
  if (Array.isArray(insights) && insights.length > 0) {
    insights.forEach((insight, i) => {
      const text = typeof insight === 'string' ? insight : (insight.message || JSON.stringify(insight));
      // bullet number
      doc.setFillColor(...C.accent);
      doc.circle(MARGIN + 3, y + 2, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.white);
      doc.text(String(i + 1), MARGIN + 3, y + 3, { align: 'center' });
      // text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.white);
      const lines = doc.splitTextToSize(text, CONTENT_W - 10);
      doc.text(lines, MARGIN + 9, y + 3);
      y += lines.length * 4.5 + 5;
      if (y > PAGE_H - 20) {
        doc.addPage();
        doc.setFillColor(...C.bg);
        doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
        drawPageHeader(doc, 'Automated Insights (cont.)', pageNum);
        y = 26;
      }
    });
  } else {
    y = drawBody(doc, 'No insights generated.', y);
  }

  /* ── SECTION 8: AI ANALYSIS ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'AI Analysis', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '9. AI Analysis — Executive Summary', y);

  const aiSummary = analysisData.ai_analysis?.summary;
  if (aiSummary) {
    // sub-label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.info);
    doc.text('GENERATED BY GEMINI ANALYTICS ENGINE', MARGIN, y);
    y += 6;
    // paragraphs
    const paragraphs = aiSummary.split(/\n+/).map(p => p.trim()).filter(Boolean);
    paragraphs.forEach(para => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.white);
      const lines = doc.splitTextToSize(para, CONTENT_W);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 4;
      if (y > PAGE_H - 20) {
        doc.addPage();
        doc.setFillColor(...C.bg);
        doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
        drawPageHeader(doc, 'AI Analysis (cont.)', pageNum);
        y = 26;
      }
    });
  } else {
    y = drawBody(doc, 'AI analysis was not generated for this dataset. Run analysis with a valid Gemini API key to enable this section.', y);
  }

  /* ── SECTION 9: RECOMMENDATIONS ── */
  doc.addPage();
  pageNum++;
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawPageHeader(doc, 'Recommendations', pageNum);
  y = 26;
  y = drawSectionTitle(doc, '10. Recommendations', y);

  const recs = analysisData.recommendations;
  if (Array.isArray(recs) && recs.length > 0) {
    const recRows = recs.map((r, i) => {
      const action = typeof r === 'string' ? r : (r.action || r.recommendation || JSON.stringify(r));
      const desc   = typeof r === 'object' ? (r.description || '') : '';
      const prio   = typeof r === 'object' ? (r.priority || '') : '';
      return [String(i + 1), action, desc, prio.toUpperCase()];
    });
    autoTable(doc, {
      ...tableDefaults(doc, pageNum),
      startY: y,
      head: [['#', 'Action', 'Description', 'Priority']],
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 60 },
        2: { cellWidth: 80 },
        3: { cellWidth: 24 },
      },
      body: recRows,
    });
  } else {
    y = drawBody(doc, 'No recommendations available.', y);
  }

  /* ── save ── */
  doc.save(fileName);
}

export { exportToPDF as exportPDF };
