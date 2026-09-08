/**
 * exportExcel.js
 * Exports analysisData as a multi-sheet .xlsx workbook using SheetJS.
 * Also supports single-sheet CSV export.
 */
import * as XLSX from 'xlsx';

const safe = (v) => (v == null ? '' : v);
const num  = (v) => (v == null ? '' : Number(v));

/* ── sheet builders ── */

function buildOverviewSheet(analysisData, datasetName) {
  const dq = analysisData.data_quality || {};
  const rows = [
    ['INSIGHTFLOW — ANALYSIS REPORT'],
    [],
    ['Dataset Name', datasetName],
    ['Generated At', new Date().toLocaleString()],
    ['Total Rows', safe(dq.row_count)],
    ['Total Columns', safe(dq.column_count)],
    ['Quality Score', safe(dq.quality_score)],
    ['Missing %', safe(dq.missing_percentage)],
    ['Duplicate Count', safe(dq.duplicates?.duplicate_count)],
    ['Duplicate %', safe(dq.duplicates?.duplicate_percentage)],
    ['Outlier Count', safe(dq.outliers?.total_outliers)],
    [],
    ['Missing Values per Column'],
    ['Column', 'Missing Count', 'Missing %'],
  ];
  const mv = dq.missing_values || [];
  mv.forEach(r => rows.push([safe(r.column), safe(r.missing_count), safe(r.missing_percentage)]));
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildKPIsSheet(analysisData) {
  const kpis = analysisData.kpis;
  if (!kpis || typeof kpis !== 'object' || kpis.message) {
    return XLSX.utils.aoa_to_sheet([['No KPI data available']]);
  }
  const rows = [['Column', 'Sum', 'Mean', 'Max', 'Min', 'Count']];
  Object.entries(kpis).forEach(([col, m]) => {
    if (typeof m === 'object') {
      rows.push([col, num(m.sum), num(m.mean), num(m.max), num(m.min), num(m.count)]);
    }
  });
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildStatisticsSheet(analysisData) {
  const stats = analysisData.statistics || {};
  const rows = [];
  const numeric = stats.numeric_stats || stats.numerical || [];
  if (numeric.length > 0) {
    rows.push(['NUMERIC STATISTICS']);
    rows.push(['Column', 'Mean', 'Std Dev', 'Min', 'Max', 'Median', '25%', '75%']);
    numeric.forEach(r => rows.push([
      safe(r.column || r.name),
      num(r.mean), num(r.std || r.std_dev),
      num(r.min), num(r.max),
      num(r.median || r['50%']),
      num(r['25%']), num(r['75%']),
    ]));
    rows.push([]);
  }
  const categorical = stats.categorical_stats || stats.categorical || [];
  if (categorical.length > 0) {
    rows.push(['CATEGORICAL STATISTICS']);
    rows.push(['Column', 'Unique Values', 'Top Value', 'Top Frequency']);
    categorical.forEach(r => rows.push([
      safe(r.column || r.name),
      safe(r.unique_count || r.unique),
      safe(r.top || r.mode),
      safe(r.top_frequency || r.freq),
    ]));
  }
  return XLSX.utils.aoa_to_sheet(rows.length ? rows : [['No statistics available']]);
}

function buildAnomaliesSheet(analysisData) {
  const anomalies = analysisData.anomalies;
  if (!anomalies || typeof anomalies !== 'object' || anomalies.message) {
    return XLSX.utils.aoa_to_sheet([['No anomaly data available']]);
  }
  const rows = [['Column', 'Anomaly Count', 'Anomaly %', 'Method', 'Threshold', 'Mean', 'Std Dev']];
  Object.entries(anomalies)
    .filter(([, v]) => typeof v === 'object')
    .forEach(([col, v]) => {
      rows.push([
        col,
        num(v.anomaly_count),
        num(v.anomaly_percentage),
        safe(v.method || 'Z-Score'),
        num(v.threshold),
        num(v.mean),
        num(v.std),
      ]);
    });
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildCorrelationsSheet(analysisData) {
  const corr = analysisData.correlations;
  const pairs = corr?.strong_pairs || corr?.strong_correlations || [];
  if (!pairs.length) {
    return XLSX.utils.aoa_to_sheet([['No strong correlations detected']]);
  }
  const rows = [['Column A', 'Column B', 'Correlation', 'Strength']];
  pairs.forEach(p => rows.push([
    safe(p.column_a || p.col1 || p.feature1),
    safe(p.column_b || p.col2 || p.feature2),
    num(p.correlation || p.value),
    safe(p.strength || (Math.abs(p.correlation || 0) > 0.7 ? 'Strong' : 'Moderate')),
  ]));
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildInsightsSheet(analysisData) {
  const insights = analysisData.insights || [];
  const rows = [['#', 'Insight']];
  insights.forEach((ins, i) => {
    const text = typeof ins === 'string' ? ins : (ins.message || JSON.stringify(ins));
    rows.push([i + 1, text]);
  });
  return XLSX.utils.aoa_to_sheet(rows.length > 1 ? rows : [['No insights available']]);
}

function buildRecommendationsSheet(analysisData) {
  const recs = analysisData.recommendations || [];
  const rows = [['#', 'Action', 'Description', 'Priority']];
  recs.forEach((r, i) => {
    const action = typeof r === 'string' ? r : (r.action || r.recommendation || '');
    const desc   = typeof r === 'object' ? (r.description || '') : '';
    const prio   = typeof r === 'object' ? (r.priority || '') : '';
    rows.push([i + 1, action, desc, prio]);
  });
  return XLSX.utils.aoa_to_sheet(rows.length > 1 ? rows : [['No recommendations available']]);
}

function buildTrendsForecastSheet(analysisData) {
  const trends   = analysisData.trends   || {};
  const forecast = analysisData.forecasting || {};
  const rows = [
    ['TRENDS'],
    ['Metric', 'Value'],
    ['Column', safe(trends.value_column)],
    ['Slope', num(trends.slope)],
    ['Intercept', num(trends.intercept)],
    ['R² Score', num(trends.r2_score)],
    ['Direction', safe(trends.trend_direction)],
    ['Strength', safe(trends.trend_strength)],
    [],
    ['FORECASTING'],
    ['Step', 'Forecasted Value'],
  ];
  if (Array.isArray(forecast.forecast_values)) {
    forecast.forecast_values.forEach((v, i) => rows.push([`Step ${i + 1}`, num(v)]));
  } else {
    rows.push(['N/A', safe(forecast.message)]);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildAIAnalysisSheet(analysisData) {
  const summary = analysisData.ai_analysis?.summary || 'No AI analysis available.';
  const rows = [
    ['AI Analysis — Executive Summary'],
    ['Generated by Gemini Analytics Engine'],
    [],
    ...summary.split(/\n+/).filter(Boolean).map(p => [p]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

/* ── column width helper ── */
function autoWidth(ws) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const colWidths = [];
  for (let C2 = range.s.c; C2 <= range.e.c; C2++) {
    let maxLen = 10;
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C2 })];
      if (cell && cell.v) maxLen = Math.max(maxLen, String(cell.v).length);
    }
    colWidths.push({ wch: Math.min(maxLen + 2, 60) });
  }
  ws['!cols'] = colWidths;
  return ws;
}

/* ═══════════════════════════════════════════════════════
   EXCEL EXPORT
═══════════════════════════════════════════════════════ */
export function exportToExcel(analysisData, datasetName = 'Dataset') {
  const wb = XLSX.utils.book_new();
  const sheets = [
    { name: 'Overview',        ws: buildOverviewSheet(analysisData, datasetName) },
    { name: 'KPIs',            ws: buildKPIsSheet(analysisData) },
    { name: 'Statistics',      ws: buildStatisticsSheet(analysisData) },
    { name: 'Trends & Forecast', ws: buildTrendsForecastSheet(analysisData) },
    { name: 'Anomalies',       ws: buildAnomaliesSheet(analysisData) },
    { name: 'Correlations',    ws: buildCorrelationsSheet(analysisData) },
    { name: 'Insights',        ws: buildInsightsSheet(analysisData) },
    { name: 'AI Analysis',     ws: buildAIAnalysisSheet(analysisData) },
    { name: 'Recommendations', ws: buildRecommendationsSheet(analysisData) },
  ];
  sheets.forEach(({ name, ws }) => {
    autoWidth(ws);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  const fileName = `report_${datasetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/* ═══════════════════════════════════════════════════════
   CSV EXPORT  (insights + recommendations flat)
═══════════════════════════════════════════════════════ */
export function exportToCSV(analysisData, datasetName = 'Dataset') {
  // Build a combined flat sheet: insights + recommendations
  const ws = XLSX.utils.aoa_to_sheet([
    ['Type', 'Index', 'Content', 'Priority'],
    ...(analysisData.insights || []).map((ins, i) => [
      'Insight', i + 1,
      typeof ins === 'string' ? ins : (ins.message || JSON.stringify(ins)),
      '',
    ]),
    ...(analysisData.recommendations || []).map((r, i) => [
      'Recommendation', i + 1,
      typeof r === 'string' ? r : (r.action || r.recommendation || ''),
      typeof r === 'object' ? (r.priority || '') : '',
    ]),
  ]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `insights_${datasetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export { exportToExcel as exportExcel, exportToCSV as exportCSV };
