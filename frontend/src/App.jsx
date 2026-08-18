import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dragActive, setDragActive] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Hello! I am your Automated Insight Assistant. Upload a dataset or ask me any question about your data." },
    { sender: 'user', text: "Can you analyze the sales trends for this quarter?" },
    { sender: 'assistant', text: "Based on sales_q2_2026.csv, there is a clear upward trend in revenue (+14.2% month-over-month), driven primarily by the Enterprise segment. However, we've identified a data quality anomaly on May 14th where sales values dropped to near-zero, which appears to be a logging error." }
  ]);

  const [selectedDataset, setSelectedDataset] = useState('sales_q2_2026.csv');
  
  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      alert(`File "${e.dataTransfer.files[0].name}" uploaded successfully (Simulated)`);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    // Simulate assistant reply after a brief timeout
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: `I've analyzed your query about "${userMsg.text}". I recommend running a linear forecast on your current dataset to project the metrics for the next 3 months.`
      }]);
    }, 1000);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">AI</div>
          <div className="logo-text">InsightFlow</div>
        </div>
        
        <nav>
          <ul className="nav-list">
            <li>
              <button 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span className="nav-icon">📊</span> Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'datasets' ? 'active' : ''}`}
                onClick={() => setActiveTab('datasets')}
              >
                <span className="nav-icon">📁</span> Datasets
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <span className="nav-icon">📈</span> Advanced Analytics
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <span className="nav-icon">💬</span> Insight Chat
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span className="nav-icon">⚙️</span> Settings
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="user-profile">
          <div className="user-avatar">NJ</div>
          <div className="user-details">
            <span className="user-name">Nishank Jain</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <header className="header">
              <div className="header-title">
                <h1>Overview Dashboard</h1>
                <p>Welcome back! Here is a summary of your automated insights, data profiles, and models.</p>
              </div>
              <div className="header-actions">
                <button className="btn-secondary">⚙️ Refresh</button>
                <button className="btn-primary" onClick={() => setActiveTab('datasets')}>+ Upload Data</button>
              </div>
            </header>

            {/* Stat Row */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Datasets Ingested</span>
                  <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>📁</div>
                </div>
                <span className="stat-value">3</span>
                <div className="stat-footer">
                  <span className="trend-up">↑ 100%</span> since last week
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Insights Synthesized</span>
                  <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>💡</div>
                </div>
                <span className="stat-value">12</span>
                <div className="stat-footer">
                  <span className="trend-up">↑ 4 new</span> insights detected
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Flagged Anomalies</span>
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⚠️</div>
                </div>
                <span className="stat-value">2</span>
                <div className="stat-footer">
                  <span className="trend-down">↓ 1 resolved</span> outlier
                </div>
              </div>
            </section>

            {/* Layout Grid */}
            <section className="dashboard-layout">
              {/* Chart Panel */}
              <div className="dashboard-card">
                <h2 className="card-title">
                  <span>Revenue Trend Analysis</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>sales_q2_2026.csv</span>
                </h2>
                <div className="chart-container">
                  <svg width="100%" height="220" viewBox="0 0 500 220" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.25)" />
                        <stop offset="100%" stopColor="rgba(8, 7, 13, 0)" />
                      </linearGradient>
                    </defs>
                    {/* Gridlines */}
                    <line x1="50" y1="30" x2="480" y2="30" className="grid-line" />
                    <line x1="50" y1="80" x2="480" y2="80" className="grid-line" />
                    <line x1="50" y1="130" x2="480" y2="130" className="grid-line" />
                    <line x1="50" y1="180" x2="480" y2="180" className="grid-line" />

                    {/* Chart Area Fill */}
                    <path d="M 50 180 L 50 140 Q 120 110 160 120 T 280 80 T 400 45 T 480 30 L 480 180 Z" className="chart-area" />

                    {/* Chart Line */}
                    <path d="M 50 140 Q 120 110 160 120 T 280 80 T 400 45 T 480 30" className="chart-line" />

                    {/* Chart Dots */}
                    <circle cx="50" cy="140" r="4" className="chart-dot" />
                    <circle cx="160" cy="120" r="4" className="chart-dot" />
                    <circle cx="280" cy="80" r="4" className="chart-dot" />
                    <circle cx="400" cy="45" r="4" className="chart-dot" />
                    <circle cx="480" cy="30" r="4" className="chart-dot" />

                    {/* Axis Labels */}
                    <text x="50" y="200" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Jan</text>
                    <text x="160" y="200" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Feb</text>
                    <text x="280" y="200" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Mar</text>
                    <text x="400" y="200" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Apr</text>
                    <text x="480" y="200" fill="var(--text-muted)" fontSize="10" textAnchor="middle">May</text>

                    <text x="35" y="145" fill="var(--text-muted)" fontSize="10" textAnchor="end">$10k</text>
                    <text x="35" y="85" fill="var(--text-muted)" fontSize="10" textAnchor="end">$20k</text>
                    <text x="35" y="35" fill="var(--text-muted)" fontSize="10" textAnchor="end">$30k</text>
                  </svg>
                </div>
              </div>

              {/* Data Quality Check gauge */}
              <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h2 className="card-title">Data Quality Index</h2>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="8"
                            strokeDasharray="314.15" strokeDashoffset="47" strokeLinecap="round"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s' }} />
                    <text x="60" y="66" fill="white" fontSize="22" fontWeight="700" textAnchor="middle">85%</text>
                  </svg>
                  <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Overall Health Score</p>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  ⚠️ <strong>Anomaly warning:</strong> IoT sensor log has high missingness rate (18% missing entries).
                </div>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: DATASETS */}
        {activeTab === 'datasets' && (
          <>
            <header className="header">
              <div className="header-title">
                <h1>Datasets Registry</h1>
                <p>Manage your uploaded databases, sensor streams, and spreadsheet files.</p>
              </div>
            </header>

            {/* Drag & Drop Simulation */}
            <div className="dashboard-card">
              <div 
                className={`upload-container ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-icon">📥</div>
                <div className="upload-text">Drag and drop your file here, or click to browse</div>
                <div className="upload-subtext">Supports CSV, JSON, XLS up to 100MB</div>
              </div>
            </div>

            {/* Datasets Table */}
            <div className="dashboard-card">
              <h2 className="card-title">Uploaded Datasets</h2>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Records</th>
                    <th>Status</th>
                    <th>Quality</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>sales_q2_2026.csv</strong></td>
                    <td>1.4 MB</td>
                    <td>12,450</td>
                    <td><span className="badge badge-success">Processed</span></td>
                    <td>98%</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSelectedDataset('sales_q2_2026.csv'); setActiveTab('analytics'); }}>Analyze</button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>user_onboarding.json</strong></td>
                    <td>420 KB</td>
                    <td>3,210</td>
                    <td><span className="badge badge-info">Processed</span></td>
                    <td>85%</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSelectedDataset('user_onboarding.json'); setActiveTab('analytics'); }}>Analyze</button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>iot_sensor_logs.csv</strong></td>
                    <td>12.8 MB</td>
                    <td>142,000</td>
                    <td><span className="badge badge-danger">Quality Flag</span></td>
                    <td>64%</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSelectedDataset('iot_sensor_logs.csv'); setActiveTab('analytics'); }}>Analyze</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 3: ADVANCED ANALYTICS */}
        {activeTab === 'analytics' && (
          <>
            <header className="header">
              <div className="header-title">
                <h1>Advanced Analytics Engine</h1>
                <p>Run profiling, statistics, correlation, forecasting, and anomaly detection algorithms.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Selected Data:</span>
                <select 
                  value={selectedDataset} 
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'white', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="sales_q2_2026.csv">sales_q2_2026.csv</option>
                  <option value="user_onboarding.json">user_onboarding.json</option>
                  <option value="iot_sensor_logs.csv">iot_sensor_logs.csv</option>
                </select>
              </div>
            </header>

            {/* Run specific modules */}
            <div className="stats-grid">
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <h3>🔍 Data Profiler</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Inspect columns, data types, missing rates, and memory foot-print overview.</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <h3>📉 Statistical Summary</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Compute means, medians, standard deviation, skewness, and distributions.</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <h3>🔗 Correlations</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Generate a Pearson/Spearman matrix to find variables influencing your targets.</p>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <h3>🔮 Forecasting</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Generate linear/time-series predictive forecasts for key numerical values.</p>
              </div>
            </div>

            {/* Simulated Analysis Output */}
            <div className="dashboard-card">
              <h2 className="card-title">Analysis Output: {selectedDataset}</h2>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', color: '#c084fc', lineHeight: '1.6' }}>
                {"{"}<br />
                &nbsp;&nbsp;"dataset": "{selectedDataset}",<br />
                &nbsp;&nbsp;"rows_count": {selectedDataset === 'sales_q2_2026.csv' ? '12450' : selectedDataset === 'user_onboarding.json' ? '3210' : '142000'},<br />
                &nbsp;&nbsp;"analysis_modules_executed": ["DataProfiler", "DataQualityAnalyzer", "StatisticalAnalyzer"],<br />
                &nbsp;&nbsp;"quality_status": "{selectedDataset === 'iot_sensor_logs.csv' ? 'WARNING' : 'HEALTHY'}",<br />
                &nbsp;&nbsp;"key_recommendations": [<br />
                &nbsp;&nbsp;&nbsp;&nbsp;{selectedDataset === 'iot_sensor_logs.csv' 
                  ? '"Handle missing values: Sensor columns temp_sensor_1 has high missing rates. Consider imputation."' 
                  : '"Deduplication: Verify unique records match. Quality score looks excellent. No immediate fixes required."'} <br />
                &nbsp;&nbsp;]<br />
                {"}"}
              </div>
            </div>
          </>
        )}

        {/* TAB 4: CHAT */}
        {activeTab === 'chat' && (
          <>
            <header className="header">
              <div className="header-title">
                <h1>Insight AI Chat</h1>
                <p>Query your datasets in natural language to compile charts, anomalies, and statistics.</p>
              </div>
            </header>

            <div className="dashboard-card chat-widget">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.sender === 'user' ? 'message-user' : 'message-assistant'}`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-row">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Ask me to find anomalies, profile a dataset, or forecast values..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-primary">Send</button>
              </form>
            </div>
          </>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <>
            <header className="header">
              <div className="header-title">
                <h1>System Settings</h1>
                <p>Manage system endpoints, pipeline integrations, and authentication values.</p>
              </div>
            </header>

            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Backend API URL</label>
                <input 
                  type="text" 
                  className="chat-input"
                  style={{ width: '100%', maxWidth: '500px' }}
                  defaultValue="http://localhost:5000/api" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Analytics Service URL</label>
                <input 
                  type="text" 
                  className="chat-input"
                  style={{ width: '100%', maxWidth: '500px' }}
                  defaultValue="http://localhost:8000" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Insight Pipeline Threshold</label>
                <input 
                  type="number" 
                  className="chat-input" 
                  style={{ width: '100%', maxWidth: '200px' }}
                  defaultValue="3.0" 
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Z-Score boundary standard deviation threshold for anomaly flag triggers.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
