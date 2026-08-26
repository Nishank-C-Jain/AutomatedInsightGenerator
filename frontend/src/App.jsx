import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  TrendingUp, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Upload, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Plus,
  Play,
  ChevronRight,
  Activity,
  BarChart2,
  Zap,
  Eye,
  Target,
  Lightbulb,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { fetchDashboardStats, fetchDatasets, fetchAnalysis, runAnalysis, uploadDataset } from './api/services.js';

// Splash screen shown during auto-refresh check
function SplashLoading() {
  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="logo-icon" style={{ width: '60px', height: '60px', fontSize: '30px', animation: 'pulse 1.5s infinite' }}>AI</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>Initializing secure session...</div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 25px var(--primary); }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// Login Screen component
function LoginView({ onLogin, onSwitch, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="logo-icon" style={{ width: '48px', height: '48px', fontSize: '24px' }}>AI</div>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to your InsightFlow account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={(e) => onLogin(e, email, password)}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input 
              type="email" 
              className="form-input" 
              required 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            Sign in
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <span className="auth-link" onClick={onSwitch}>
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}

// Register Screen component
function RegisterView({ onRegister, onSwitch, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    onRegister(e, {
      name,
      email,
      password
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="logo-icon" style={{ width: '48px', height: '48px', fontSize: '24px' }}>AI</div>
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started with InsightFlow</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="Nishank"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input 
              type="email" 
              className="form-input" 
              required 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              placeholder="•••••••• (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            Create account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={onSwitch}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Toast Notification ────────────────────────────────────────────────────── //
function Toast({ id, message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4200);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  const palette = {
    success: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
    error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
    info:    { bg: 'rgba(6,182,212,0.12)',    border: 'rgba(6,182,212,0.3)',   icon: 'ℹ️' },
    warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
  };
  const c = palette[type] || palette.info;
  return (
    <div className="toast" style={{ background: c.bg, borderColor: c.border }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.icon}</span>
      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.4' }}>{message}</span>
      <button onClick={() => onDismiss(id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', display: 'flex', flexShrink: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => <Toast key={t.id} {...t} onDismiss={onDismiss} />)}
    </div>
  );
}

// ── Onboarding Wizard ─────────────────────────────────────────────────────── //
function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      emoji: '🚀',
      title: 'Welcome to InsightFlow',
      desc: 'An AI-powered analytics engine that automatically profiles, scores, correlates, forecasts, and generates insights from any CSV or Excel dataset — in seconds.',
      bullets: ['9-step analysis pipeline', 'KPI metrics per column', 'Auto anomaly detection', 'Linear trend forecasting & AI recommendations'],
    },
    {
      emoji: '📂',
      title: 'Step 1 — Upload Your Data',
      desc: 'Head to the Datasets tab and drag-and-drop a CSV or Excel file. Your data is processed securely on your own server.',
      bullets: ['Supports .csv, .xlsx, .xls', 'Up to 10 MB per file', 'Instant upload feedback', 'All uploads listed in the Datasets registry'],
    },
    {
      emoji: '⚡',
      title: 'Step 2 — Run Analysis',
      desc: 'Go to Advanced Analytics, pick your dataset from the dropdown, and click Run Analysis. Results are cached — reloaded instantly on revisit.',
      bullets: ['Data quality score (0–100)', 'Correlation heatmap', 'Trends chart & 5-step forecast', 'Prioritised recommendations'],
    },
  ];
  const s = steps[step];
  const isLast = step === steps.length - 1;
  return (
    <div className="onboarding-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="onboarding-modal">
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? '28px' : '8px', height: '8px', borderRadius: '4px', background: i === step ? 'var(--primary)' : i < step ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.12)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ fontSize: '52px', textAlign: 'center', marginBottom: '16px', lineHeight: 1 }}>{s.emoji}</div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '12px', background: 'linear-gradient(to right,#fff,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', textAlign: 'center', marginBottom: '22px' }}>{s.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '30px' }}>
          {s.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.14)', borderRadius: '9px', padding: '10px 14px' }}>
              <CheckCircle2 size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Skip</button>
          <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => isLast ? onClose() : setStep(s => s + 1)}>
            {isLast ? '🎉 Get Started' : <><span>Next</span><ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Analysis Loading Skeleton ─────────────────────────────────────────────── //
function AnalysisSkeleton({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          {message}
        </div>
      )}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '80px', flex: 1, minWidth: '120px', borderRadius: '12px' }} />)}
      </div>
      {[{ h: 200, w: '40%' }, { h: 150, w: '65%' }, { h: 280, w: '55%' }].map((d, i) => (
        <div key={i} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="skeleton" style={{ height: '16px', width: d.w, borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: d.h + 'px', borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  );
}

// ── Step Progress Indicator ───────────────────────────────────────────────── //
function StepProgress({ datasets, selectedDataset, analysisData }) {
  const steps = [
    { label: 'Upload Dataset', done: datasets.length > 0 },
    { label: 'Select Dataset', done: !!selectedDataset },
    { label: 'Run Analysis',   done: !!analysisData },
    { label: 'View Results',   done: !!analysisData },
  ];
  const currentStep = steps.reduce((acc, s, i) => (s.done ? i : acc), -1);
  return (
    <div className="step-progress">
      {steps.map((s, i) => {
        const state = s.done ? 'done' : i === currentStep + 1 ? 'active' : 'pending';
        return (
          <React.Fragment key={i}>
            <div className={`step-item step-${state}`}>
              <div className="step-circle">{s.done ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}</div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-line${s.done ? ' done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Main App Dashboard shell
function App() {
  // Authentication states consumed from global Context
  const { user, isAuthenticated, loading, login, register, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authError, setAuthError] = useState('');

  // UI tabs state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dragActive, setDragActive] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: "Hello! I am your Automated Insight Assistant. Upload a dataset or ask me any question about your data." }
  ]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [uploadMessage, setUploadMessage] = useState(''); // success/error feedback
  const fileInputRef = useRef(null);
  
  const [dashboardStats, setDashboardStats] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Analytics tab state
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null); // 'pending' | 'analyzed' | 'failed'
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [isFetchingCached, setIsFetchingCached] = useState(false);

  // Toast + onboarding
  const [toasts, setToasts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('insightflow_onboarded')
  );

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats().then(res => {
        if (res.success) setDashboardStats(res.data);
      }).catch(console.error);
      
      fetchDatasets().then(res => {
        if (res.success) setDatasetsList(res.datasets);
      }).catch(console.error);
    }
  }, [isAuthenticated, activeTab]);

  // When user picks a dataset in the Analytics tab, try to load cached results
  useEffect(() => {
    if (!selectedDataset) {
      setAnalysisData(null);
      setAnalysisStatus(null);
      setAnalysisError('');
      return;
    }
    setAnalysisData(null);
    setAnalysisError('');
    setIsFetchingCached(true);
    fetchAnalysis(selectedDataset).then(res => {
      setAnalysisStatus(res.status || null);
      if (res.analysis) {
        setAnalysisData(res.analysis);
        addToast('Cached analysis loaded — results are ready!', 'info');
      }
    }).catch(() => {
      setAnalysisStatus(null);
    }).finally(() => {
      setIsFetchingCached(false);
    });
  }, [selectedDataset]);

  const handleRunAnalysis = async () => {
    if (!selectedDataset) return;
    setIsAnalysisRunning(true);
    setAnalysisError('');
    setAnalysisData(null);
    try {
      const res = await runAnalysis(selectedDataset);
      if (res.success && res.analysis) {
        setAnalysisData(res.analysis);
        setAnalysisStatus('analyzed');
        addToast('Analysis complete! All 9 analyzers finished successfully.', 'success');
      } else {
        const msg = res.message || 'Analysis returned no data.';
        setAnalysisError(msg);
        addToast(msg, 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Analysis failed.';
      setAnalysisError(msg);
      addToast(msg, 'error');
    } finally {
      setIsAnalysisRunning(false);
    }
  };

  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    setAuthError('');
    try {
      await login(email, password);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e, fields) => {
    e.preventDefault();
    setAuthError('');
    try {
      await register(fields.name, fields.email, fields.password);
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please check your details.');
    }
  };

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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await doUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await doUpload(e.target.files[0]);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const doUpload = async (file) => {
    setUploadMessage('');
    try {
      setIsUploading(true);
      const res = await uploadDataset(file);
      setUploadMessage(`✅ "${file.name}" uploaded successfully!`);
      addToast(`"${file.name}" uploaded! Go to Advanced Analytics to analyze it.`, 'success');
      fetchDatasets().then(r => r.success && setDatasetsList(r.datasets));
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Upload failed';
      setUploadMessage(`❌ ${msg}`);
      addToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: `I've analyzed your query about "${userMsg.text}". I recommend running a linear forecast on your current dataset to project the metrics for the next 3 months.`
      }]);
    }, 1000);
  };

  // Guard routing checks
  if (loading) {
    return <SplashLoading />;
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginView 
        onLogin={handleLogin} 
        onSwitch={() => { setAuthMode('register'); setAuthError(''); }}
        error={authError} 
      />
    ) : (
      <RegisterView 
        onRegister={handleRegister} 
        onSwitch={() => { setAuthMode('login'); setAuthError(''); }} 
        error={authError}
      />
    );
  }

  return (
    <div className="app-container">
      {/* ── Global overlays ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {showOnboarding && (
        <OnboardingModal onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('insightflow_onboarded', '1');
        }} />
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">AI</div>
          <div className="logo-text">InsightFlow</div>
        </div>
        
        <nav style={{ flex: 1 }}>
          <ul className="nav-list">
            <li>
              <button 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <LayoutDashboard size={18} style={{ marginRight: '4px' }} /> Dashboard
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'datasets' ? 'active' : ''}`}
                onClick={() => setActiveTab('datasets')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <Database size={18} style={{ marginRight: '4px' }} /> Datasets
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <TrendingUp size={18} style={{ marginRight: '4px' }} /> Advanced Analytics
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <MessageSquare size={18} style={{ marginRight: '4px' }} /> Insight Chat
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <Settings size={18} style={{ marginRight: '4px' }} /> Settings
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="user-profile">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', fontWeight: 'bold' }}>
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="user-details" style={{ flex: 1, minWidth: 0 }}>
            <span className="user-name" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
              {user.name}
            </span>
            <span className="user-role" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Standard User
            </span>
          </div>
          <button className="user-logout-btn" title="Log out" onClick={logout}>
            <LogOut size={16} />
          </button>
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
                <p>Welcome back, {user.name}! Here is a summary of your automated insights, data profiles, and models.</p>
              </div>
              <div className="header-actions">
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => {
                    fetchDashboardStats().then(res => { if (res.success) setDashboardStats(res.data); }).catch(console.error);
                    fetchDatasets().then(res => { if (res.success) setDatasetsList(res.datasets); }).catch(console.error);
                  }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setActiveTab('datasets')}>
                  <Plus size={16} /> Upload Data
                </button>
              </div>
            </header>

            {/* Stat Row */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Datasets Ingested</span>
                  <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                    <Database size={16} />
                  </div>
                </div>
                <span className="stat-value">{dashboardStats?.stats?.totalDatasets ?? 0}</span>
                <div className="stat-footer">
                  <span className="trend-up">↑ Live</span> connected
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Insights Synthesized</span>
                  <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                    <Sparkles size={16} />
                  </div>
                </div>
                <span className="stat-value">{dashboardStats?.stats?.totalInsights ?? 0}</span>
                <div className="stat-footer">
                  <span className="trend-up">↑ Updated</span> real-time
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Flagged Anomalies</span>
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <span className="stat-value">{dashboardStats?.stats?.totalAnomalies ?? 0}</span>
                <div className="stat-footer">
                  <span className="trend-down">↓ Checked</span> against baseline
                </div>
              </div>
            </section>

            {/* Layout Grid */}
            <section className="dashboard-layout">
              {/* Recent Datasets Activity Chart */}
              <div className="dashboard-card">
                <h2 className="card-title">
                  <span>Recent Dataset Activity</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Last 5 uploads</span>
                </h2>
                {(() => {
                  const recent = dashboardStats?.recentActivity?.datasets ?? [];
                  if (recent.length === 0) {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
                        <Database size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No datasets yet. Upload your first dataset to see activity here.</p>
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recent.map((ds, i) => {
                        const statusColor = ds.status === 'analyzed' || ds.status === 'completed' ? '#10b981'
                          : ds.status === 'failed' ? '#ef4444'
                          : ds.status === 'ready' ? '#f59e0b'
                          : '#6b7280';
                        const date = new Date(ds.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={ds.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid var(--border-glass)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => { setSelectedDataset(ds.id); setActiveTab('analytics'); }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Database size={16} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{ds.file_type?.toUpperCase()} · {date}</p>
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`, flexShrink: 0 }}>
                              {ds.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Live Quality + Anomalies panel */}
              <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 className="card-title">System Health</h2>
                {/* Quality gauge — computed from most recently analyzed dataset */}
                <div style={{ textAlign: 'center' }}>
                  {(() => {
                    const totalDs = dashboardStats?.stats?.totalDatasets ?? 0;
                    const totalInsights = dashboardStats?.stats?.totalInsights ?? 0;
                    const totalAnomalies = dashboardStats?.stats?.totalAnomalies ?? 0;
                    // Health score: penalize for anomaly rate vs insights
                    const score = totalDs === 0 ? 0
                      : Math.max(0, Math.min(100, Math.round(
                          100 - (totalAnomalies / Math.max(totalDs, 1)) * 10
                          + (totalInsights / Math.max(totalDs, 1)) * 2
                        )));
                    const r = 46, circ = 2 * Math.PI * r;
                    const offset = circ - (score / 100) * circ;
                    const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : score === 0 ? 'rgba(255,255,255,0.1)' : '#ef4444';
                    return (
                      <svg width="110" height="110" viewBox="0 0 110 110">
                        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
                          strokeDasharray={circ.toFixed(2)} strokeDashoffset={offset.toFixed(2)} strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }} />
                        <text x="55" y="52" fill="white" fontSize="20" fontWeight="700" textAnchor="middle">{totalDs === 0 ? '—' : score}</text>
                        {totalDs > 0 && <text x="55" y="65" fill="var(--text-muted)" fontSize="9" textAnchor="middle">/ 100</text>}
                      </svg>
                    );
                  })()}
                  <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>System Health Score</p>
                </div>
                {/* Mini stats */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Total Datasets', value: dashboardStats?.stats?.totalDatasets ?? 0, color: '#8b5cf6' },
                    { label: 'Total Insights', value: dashboardStats?.stats?.totalInsights ?? 0, color: '#ec4899' },
                    { label: 'Anomaly Flags', value: dashboardStats?.stats?.totalAnomalies ?? 0, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: '700', color }}>{value}</span>
                    </div>
                  ))}
                </div>
                {dashboardStats?.stats?.totalAnomalies > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <span><strong>{dashboardStats.stats.totalAnomalies}</strong> anomaly flag{dashboardStats.stats.totalAnomalies !== 1 ? 's' : ''} detected across your datasets.</span>
                  </div>
                )}
                {(!dashboardStats || dashboardStats?.stats?.totalDatasets === 0) && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', textAlign: 'center' }}>
                    Upload and analyze a dataset to see live health data.
                  </div>
                )}
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

            {/* Upload area */}
            <div className="dashboard-card">
              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div
                className={`upload-container ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{ cursor: isUploading ? 'wait' : 'pointer' }}
              >
                <div className="upload-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                  {isUploading
                    ? <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                    : <Upload size={32} style={{ color: 'var(--primary)' }} />}
                </div>
                <div className="upload-text">
                  {isUploading ? 'Uploading…' : 'Drag & drop or click to browse'}
                </div>
                <div className="upload-subtext">Supports CSV, XLSX, XLS · max 10 MB</div>
                {!isUploading && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: '4px', pointerEvents: 'none' }}
                    tabIndex={-1}
                  >
                    <Upload size={14} /> Browse File
                  </button>
                )}
              </div>
              {/* Inline upload feedback */}
              {uploadMessage && (
                <div style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: uploadMessage.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${uploadMessage.startsWith('✅') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: uploadMessage.startsWith('✅') ? '#34d399' : '#fca5a5',
                }}>
                  {uploadMessage}
                </div>
              )}
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
                    <th>Columns</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasetsList.map(ds => (
                  <tr key={ds.id}>
                    <td><strong>{ds.name}</strong></td>
                    <td>{Math.round(ds.file_size / 1024)} KB</td>
                    <td>{ds.row_count ?? 'N/A'}</td>
                    <td>{ds.column_count ?? 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        ds.status === 'analyzed' ? 'badge-success' :
                        ds.status === 'completed' ? 'badge-success' :
                        ds.status === 'failed' ? 'badge-danger' :
                        ds.status === 'ready' ? 'badge-warning' :
                        'badge-info'
                      }`}>{ds.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => { setSelectedDataset(ds.id); setActiveTab('analytics'); }}
                      >
                        {ds.status === 'analyzed' ? '📊 View' : '⚡ Analyze'}
                      </button>
                    </td>
                  </tr>
                  ))}
                  {datasetsList.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No datasets uploaded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 3: ADVANCED ANALYTICS */}
        {activeTab === 'analytics' && (
          <>
            <header className="header" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div className="header-title">
                <h1>Advanced Analytics Engine</h1>
                <p>9-analyzer pipeline: profiling, statistics, correlations, KPIs, trends, forecasting, anomalies, insights &amp; recommendations.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'white', padding: '8px 12px', borderRadius: '8px', outline: 'none', minWidth: '180px' }}
                >
                  <option value="">Select a dataset</option>
                  {datasetsList.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (!selectedDataset || isAnalysisRunning) ? 0.6 : 1 }}
                  onClick={handleRunAnalysis}
                  disabled={!selectedDataset || isAnalysisRunning}
                  id="run-analysis-btn"
                >
                  {isAnalysisRunning ? <span className="spinner" /> : <Play size={14} />}
                  {isAnalysisRunning ? 'Analyzing…' : 'Run Analysis'}
                </button>
              </div>
            </header>

            {/* Workflow step progress */}
            <StepProgress datasets={datasetsList} selectedDataset={selectedDataset} analysisData={analysisData} />

            {/* Error banner */}
            {analysisError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '14px 18px', color: '#fca5a5', fontSize: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />{analysisError}
              </div>
            )}

            {/* Empty state — no dataset selected */}
            {!selectedDataset && !analysisData && !isFetchingCached && (
              <div className="dashboard-card empty-state-card">
                <div className="empty-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <BarChart2 size={32} style={{ color: 'var(--primary)' }} />
                </div>
                <h3>No Dataset Selected</h3>
                <p>Select a dataset from the dropdown above, then click <strong>Run Analysis</strong> to start the 9-analyzer pipeline and generate your full report.</p>
                <div className="cta-row">
                  {datasetsList.length === 0 ? (
                    <button className="btn-primary" onClick={() => setActiveTab('datasets')}>
                      <Upload size={14} /> Upload Your First Dataset
                    </button>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {datasetsList.length} dataset{datasetsList.length !== 1 ? 's' : ''} available — use the dropdown above.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Skeleton — loading cached results or running analysis */}
            {(isFetchingCached || isAnalysisRunning) && !analysisData && (
              <AnalysisSkeleton message={isAnalysisRunning ? 'Running 9-analyzer pipeline… this takes 5–15 seconds' : 'Loading cached results…'} />
            )}

            {/* Empty state — dataset selected but no analysis yet */}
            {selectedDataset && !analysisData && !isAnalysisRunning && !isFetchingCached && !analysisError && (
              <div className="dashboard-card empty-state-card">
                <div className="empty-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Zap size={32} style={{ color: 'var(--warning)' }} />
                </div>
                <h3>Ready to Analyze</h3>
                <p>Dataset selected. Click <strong>Run Analysis</strong> to start the full 9-step pipeline. Typical run time: 5–15 seconds.</p>
                <div className="cta-row">
                  <button className="btn-primary" onClick={handleRunAnalysis} disabled={isAnalysisRunning}>
                    <Play size={14} /> Run Analysis Now
                  </button>
                </div>
              </div>
            )}

            {/* ── ANALYSIS REPORT ── */}
            {analysisData && (
              <>

                {/* ① OVERVIEW BANNER */}
                <div className="analysis-overview-banner">
                  <div className="kpi-chip" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }}>
                    <span className="kpi-chip-label">Quality Score</span>
                    <span className="kpi-chip-value" style={{ color: '#a78bfa' }}>{analysisData.data_quality?.overall_score ?? analysisData.data_quality?.score ?? '—'}<span style={{ fontSize: '14px', fontWeight: 400 }}>%</span></span>
                  </div>
                  <div className="kpi-chip" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }}>
                    <span className="kpi-chip-label">Rows</span>
                    <span className="kpi-chip-value" style={{ color: '#34d399' }}>{analysisData.data_quality?.total_rows ?? '—'}</span>
                  </div>
                  <div className="kpi-chip" style={{ background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.3)' }}>
                    <span className="kpi-chip-label">Columns</span>
                    <span className="kpi-chip-value" style={{ color: '#22d3ee' }}>{analysisData.data_quality?.total_columns ?? '—'}</span>
                  </div>
                  <div className="kpi-chip" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <span className="kpi-chip-label">Duplicates</span>
                    <span className="kpi-chip-value" style={{ color: '#fbbf24' }}>{analysisData.data_quality?.duplicates?.duplicate_count ?? 0}</span>
                  </div>
                  <div className="kpi-chip" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <span className="kpi-chip-label">Anomaly Cols</span>
                    <span className="kpi-chip-value" style={{ color: '#f87171' }}>
                      {analysisData.anomalies && typeof analysisData.anomalies === 'object' && !analysisData.anomalies.message
                        ? Object.values(analysisData.anomalies).filter(a => a?.anomaly_count > 0).length
                        : 0}
                    </span>
                  </div>
                  <div className="kpi-chip" style={{ background: 'rgba(236,72,153,0.12)', borderColor: 'rgba(236,72,153,0.3)' }}>
                    <span className="kpi-chip-label">Insights</span>
                    <span className="kpi-chip-value" style={{ color: '#f472b6' }}>{Array.isArray(analysisData.insights) ? analysisData.insights.length : 0}</span>
                  </div>
                </div>

                {/* ② DATA QUALITY */}
                <div className="dashboard-card">
                  <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Eye size={18} style={{ color: '#a78bfa' }} />Data Quality</span></h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '32px', alignItems: 'start' }}>
                    {/* Donut gauge */}
                    <div style={{ textAlign: 'center' }}>
                      {(() => {
                        const score = analysisData.data_quality?.overall_score ?? analysisData.data_quality?.score ?? 0;
                        const pct = Math.min(100, Math.max(0, parseFloat(score) || 0));
                        const r = 50, circ = 2 * Math.PI * r;
                        const offset = circ - (pct / 100) * circ;
                        const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                        return (
                          <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                            <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
                              strokeDasharray={circ.toFixed(2)} strokeDashoffset={offset.toFixed(2)} strokeLinecap="round"
                              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1.2s ease' }} />
                            <text x="60" y="58" fill="white" fontSize="20" fontWeight="700" textAnchor="middle">{Math.round(pct)}</text>
                            <text x="60" y="72" fill="var(--text-muted)" fontSize="10" textAnchor="middle">/ 100</text>
                          </svg>
                        );
                      })()}
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Overall Score</p>
                    </div>
                    {/* Missing values table */}
                    <div>
                      {Array.isArray(analysisData.data_quality?.missing_values) && analysisData.data_quality.missing_values.length > 0 ? (
                        <table className="glass-table" style={{ fontSize: '13px' }}>
                          <thead><tr><th>Column</th><th>Missing</th><th>Missing %</th><th>Severity</th></tr></thead>
                          <tbody>
                            {analysisData.data_quality.missing_values.map((mv, i) => {
                              const pct = parseFloat(mv.missing_percentage ?? 0);
                              const severity = pct > 20 ? 'badge-danger' : pct > 5 ? 'badge-info' : 'badge-success';
                              const label = pct > 20 ? 'High' : pct > 5 ? 'Medium' : 'Low';
                              return (
                                <tr key={i}>
                                  <td><strong>{mv.column}</strong></td>
                                  <td>{mv.missing_count ?? '—'}</td>
                                  <td>{pct.toFixed(1)}%</td>
                                  <td><span className={`badge ${severity}`}>{label}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', paddingTop: '16px' }}>✅ No missing values detected.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ③ STATISTICAL SUMMARY */}
                {analysisData.statistics && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={18} style={{ color: '#22d3ee' }} />Statistical Summary</span></h2>
                    {analysisData.statistics.numerical && Object.keys(analysisData.statistics.numerical).length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="glass-table" style={{ fontSize: '13px', minWidth: '700px' }}>
                          <thead>
                            <tr>
                              <th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skewness</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analysisData.statistics.numerical).map(([col, s], i) => (
                              <tr key={i}>
                                <td><strong>{col}</strong></td>
                                <td>{s.mean != null ? parseFloat(s.mean).toFixed(3) : '—'}</td>
                                <td>{s.median != null ? parseFloat(s.median).toFixed(3) : '—'}</td>
                                <td>{s.std != null ? parseFloat(s.std).toFixed(3) : '—'}</td>
                                <td>{s.min != null ? parseFloat(s.min).toFixed(2) : '—'}</td>
                                <td>{s.max != null ? parseFloat(s.max).toFixed(2) : '—'}</td>
                                <td>
                                  <span style={{ color: Math.abs(parseFloat(s.skewness ?? 0)) > 1 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                                    {s.skewness != null ? parseFloat(s.skewness).toFixed(3) : '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No numerical columns found.</p>
                    )}
                    {/* Categorical summary */}
                    {analysisData.statistics.categorical && Object.keys(analysisData.statistics.categorical).length > 0 && (
                      <div style={{ marginTop: '24px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Categorical Columns</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {Object.entries(analysisData.statistics.categorical).map(([col, s], i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '12px 16px', minWidth: '160px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{col}</p>
                              <p style={{ fontSize: '14px', fontWeight: '600' }}>{s.unique_count ?? s.unique} unique</p>
                              {s.top && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Top: <em>{s.top}</em></p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ④ KPIs */}
                {analysisData.kpis && Object.keys(analysisData.kpis).length > 0 && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Target size={18} style={{ color: '#f472b6' }} />KPI Metrics</span></h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      {Object.entries(analysisData.kpis).map(([col, metrics], i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</p>
                          {metrics && Object.entries(metrics).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}</span>
                              <span style={{ fontWeight: '600' }}>{typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ⑤ CORRELATIONS HEATMAP */}
                {analysisData.correlations && !analysisData.correlations.message && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart2 size={18} style={{ color: '#34d399' }} />Correlation Matrix</span></h2>
                    {(() => {
                      const matrix = analysisData.correlations?.correlation_matrix;
                      const pairs = analysisData.correlations?.strong_pairs || analysisData.correlations?.strong_correlations;
                      if (!matrix || Object.keys(matrix).length === 0) {
                        return (
                          <>
                            {pairs && pairs.length > 0 && (
                              <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Strong correlation pairs:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  {pairs.map((p, i) => {
                                    const corr = parseFloat(p.correlation ?? p.value ?? 0);
                                    const color = corr > 0 ? '#34d399' : '#f87171';
                                    return (
                                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                                        <strong>{p.column1 ?? p.col1}</strong> ↔ <strong>{p.column2 ?? p.col2}</strong>
                                        <span style={{ marginLeft: '8px', color, fontWeight: 700 }}>{corr.toFixed(3)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {(!pairs || pairs.length === 0) && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No correlation data available.</p>}
                          </>
                        );
                      }

                      const cols = Object.keys(matrix);
                      const cellSize = Math.max(42, Math.min(70, Math.floor(540 / cols.length)));
                      const labelW = 90;
                      const svgW = labelW + cols.length * cellSize;
                      const svgH = labelW + cols.length * cellSize;

                      const getColor = (v) => {
                        const val = parseFloat(v ?? 0);
                        if (isNaN(val)) return 'rgba(255,255,255,0.03)';
                        if (val >= 0) {
                          const g = Math.round(180 * val);
                          return `rgba(52, ${100 + g}, 120, ${0.15 + 0.6 * Math.abs(val)})`;
                        } else {
                          const r = Math.round(220 * Math.abs(val));
                          return `rgba(${140 + r}, 50, 80, ${0.15 + 0.6 * Math.abs(val)})`;
                        }
                      };

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <svg width={svgW} height={svgH} style={{ fontFamily: 'var(--font-sans)' }}>
                            {/* column headers */}
                            {cols.map((col, ci) => (
                              <text key={ci} x={labelW + ci * cellSize + cellSize / 2} y={labelW - 6}
                                fill="var(--text-muted)" fontSize="10" textAnchor="end"
                                transform={`rotate(-45, ${labelW + ci * cellSize + cellSize / 2}, ${labelW - 6})`}>
                                {col.length > 10 ? col.slice(0, 10) + '…' : col}
                              </text>
                            ))}
                            {/* row labels + cells */}
                            {cols.map((rowCol, ri) => (
                              <g key={ri}>
                                <text x={labelW - 6} y={labelW + ri * cellSize + cellSize / 2 + 4}
                                  fill="var(--text-muted)" fontSize="10" textAnchor="end">
                                  {rowCol.length > 10 ? rowCol.slice(0, 10) + '…' : rowCol}
                                </text>
                                {cols.map((colCol, ci) => {
                                  const val = matrix[rowCol]?.[colCol];
                                  const numVal = parseFloat(val ?? 0);
                                  return (
                                    <g key={ci}>
                                      <rect
                                        x={labelW + ci * cellSize} y={labelW + ri * cellSize}
                                        width={cellSize} height={cellSize}
                                        fill={getColor(val)} rx="3"
                                        stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                                      />
                                      <text
                                        x={labelW + ci * cellSize + cellSize / 2}
                                        y={labelW + ri * cellSize + cellSize / 2 + 4}
                                        fill={Math.abs(numVal) > 0.5 ? 'white' : 'var(--text-secondary)'}
                                        fontSize="9" textAnchor="middle" fontWeight={Math.abs(numVal) > 0.7 ? '700' : '400'}>
                                        {isNaN(numVal) ? '' : numVal.toFixed(2)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </g>
                            ))}
                            {/* Legend */}
                            <defs>
                              <linearGradient id="corr-legend" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="rgba(220,50,80,0.8)" />
                                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                                <stop offset="100%" stopColor="rgba(52,180,120,0.8)" />
                              </linearGradient>
                            </defs>
                            <rect x={labelW} y={svgH - 20} width={cols.length * cellSize} height="8" fill="url(#corr-legend)" rx="4" />
                            <text x={labelW} y={svgH - 6} fill="var(--text-muted)" fontSize="9">-1.00</text>
                            <text x={labelW + cols.length * cellSize / 2} y={svgH - 6} fill="var(--text-muted)" fontSize="9" textAnchor="middle">0.00</text>
                            <text x={labelW + cols.length * cellSize} y={svgH - 6} fill="var(--text-muted)" fontSize="9" textAnchor="end">+1.00</text>
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ⑥ TRENDS & FORECASTING */}
                <div className="dashboard-card">
                  <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp size={18} style={{ color: '#fbbf24' }} />Trends &amp; Forecasting</span></h2>
                  {analysisData.trends?.message ? (
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>ℹ️ {analysisData.trends.message}</p>
                    </div>
                  ) : (
                    (() => {
                      const trend = analysisData.trends;
                      const forecast = analysisData.forecasting;
                      const trendPoints = trend?.trend_values ?? [];
                      const forecastPoints = forecast?.forecast ?? [];

                      const allValues = [...trendPoints, ...forecastPoints.map(f => f.value ?? f)].filter(v => typeof v === 'number');
                      if (allValues.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No trend data to display.</p>;

                      const minV = Math.min(...allValues);
                      const maxV = Math.max(...allValues);
                      const range = maxV - minV || 1;
                      const W = 540, H = 180, pad = 40;
                      const totalPts = trendPoints.length + forecastPoints.length;
                      const xStep = (W - pad) / Math.max(totalPts - 1, 1);
                      const toY = (v) => H - pad / 2 - ((v - minV) / range) * (H - pad);
                      const toX = (i) => pad / 2 + i * xStep;

                      const trendPath = trendPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
                      const forecastStart = trendPoints.length - 1;
                      const forecastPath = [
                        `M ${toX(forecastStart).toFixed(1)} ${toY(trendPoints[forecastStart] ?? forecastPoints[0]?.value ?? forecastPoints[0]).toFixed(1)}`,
                        ...forecastPoints.map((f, i) => {
                          const v = typeof f === 'number' ? f : (f.value ?? f.forecast_value ?? 0);
                          return `L ${toX(forecastStart + 1 + i).toFixed(1)} ${toY(v).toFixed(1)}`;
                        })
                      ].join(' ');

                      return (
                        <div>
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '24px', height: '3px', background: '#8b5cf6', display: 'inline-block', borderRadius: '2px' }} />Actual Trend</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '24px', height: '3px', background: '#f59e0b', display: 'inline-block', borderRadius: '2px', borderStyle: 'dashed' }} />Forecast</span>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <svg width={W} height={H} style={{ overflow: 'visible' }}>
                              <defs>
                                <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(139,92,246,0.25)" />
                                  <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                                </linearGradient>
                              </defs>
                              {/* Gridlines */}
                              {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                                const y = toY(minV + frac * range);
                                return <line key={frac} x1={pad / 2} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                              })}
                              {/* Area fill */}
                              {trendPoints.length > 1 && (
                                <path d={`${trendPath} L ${toX(trendPoints.length - 1).toFixed(1)} ${H - pad / 2} L ${toX(0).toFixed(1)} ${H - pad / 2} Z`}
                                  fill="url(#trend-area)" />
                              )}
                              {/* Trend line */}
                              {trendPoints.length > 1 && <path d={trendPath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                              {/* Forecast dashed line */}
                              {forecastPoints.length > 0 && <path d={forecastPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" />}
                              {/* Y-axis labels */}
                              {[0, 0.5, 1].map(frac => (
                                <text key={frac} x={pad / 2 - 4} y={toY(minV + frac * range) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                                  {(minV + frac * range).toFixed(1)}
                                </text>
                              ))}
                              {/* Trend slope indicator */}
                              {trend?.slope != null && (
                                <text x={W - 4} y="12" fill={trend.slope >= 0 ? '#34d399' : '#f87171'} fontSize="11" textAnchor="end" fontWeight="600">
                                  slope: {trend.slope >= 0 ? '+' : ''}{parseFloat(trend.slope).toFixed(3)}
                                </text>
                              )}
                            </svg>
                          </div>
                          {forecast?.forecast_summary && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>{forecast.forecast_summary}</p>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* ⑦ ANOMALIES */}
                {analysisData.anomalies && typeof analysisData.anomalies === 'object' && !analysisData.anomalies.message && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle size={18} style={{ color: '#f87171' }} />Anomaly Detection</span></h2>
                    {Object.values(analysisData.anomalies).every(a => !a?.anomaly_count || a.anomaly_count === 0)
                      ? <p style={{ color: 'var(--success)', fontSize: '14px' }}>✅ No anomalies detected across all numeric columns.</p>
                      : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                          {Object.entries(analysisData.anomalies).map(([col, anom], i) => {
                            if (!anom || anom.anomaly_count === 0) return null;
                            const pct = parseFloat(anom.anomaly_percentage ?? 0);
                            const severity = pct > 10 ? 'high' : pct > 5 ? 'medium' : 'low';
                            const badgeClass = severity === 'high' ? 'badge-danger' : severity === 'medium' ? 'badge-info' : 'badge-success';
                            const borderColor = severity === 'high' ? 'rgba(239,68,68,0.3)' : severity === 'medium' ? 'rgba(6,182,212,0.3)' : 'rgba(16,185,129,0.2)';
                            return (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <strong style={{ fontSize: '14px' }}>{col}</strong>
                                  <span className={`badge ${badgeClass}`}>{severity}</span>
                                </div>
                                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '5px', color: 'var(--text-secondary)' }}>
                                  <span>🚨 <strong style={{ color: 'var(--text-primary)' }}>{anom.anomaly_count}</strong> anomalies ({pct.toFixed(1)}%)</span>
                                  {anom.mean != null && <span>μ = {parseFloat(anom.mean).toFixed(3)}, σ = {parseFloat(anom.std ?? 0).toFixed(3)}</span>}
                                  {Array.isArray(anom.detected_values) && anom.detected_values.length > 0 && (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                      Outlier vals: {anom.detected_values.slice(0, 4).map(v => parseFloat(v).toFixed(2)).join(', ')}{anom.detected_values.length > 4 ? '…' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}

                {/* ⑧ INSIGHTS */}
                {Array.isArray(analysisData.insights) && analysisData.insights.length > 0 && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Lightbulb size={18} style={{ color: '#fbbf24' }} />AI Insights</span></h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisData.insights.map((insight, i) => (
                        <div key={i} className="insight-card">
                          <div className="insight-number">{i + 1}</div>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{typeof insight === 'string' ? insight : JSON.stringify(insight)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ⑨ RECOMMENDATIONS */}
                {Array.isArray(analysisData.recommendations) && analysisData.recommendations.length > 0 && (
                  <div className="dashboard-card">
                    <h2 className="card-title"><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} style={{ color: '#34d399' }} />Recommendations</span></h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisData.recommendations.map((rec, i) => {
                        const action      = typeof rec === 'string' ? rec : (rec.action ?? rec.recommendation ?? JSON.stringify(rec));
                        const description = typeof rec === 'object' ? (rec.description ?? '') : '';
                        const priority    = typeof rec === 'object' ? (rec.priority ?? '').toLowerCase() : '';
                        const priorityColor  = priority === 'high' ? '#f87171' : priority === 'medium' ? '#fbbf24' : '#34d399';
                        const iconBg         = priority === 'high' ? 'rgba(239,68,68,0.12)'   : priority === 'medium' ? 'rgba(245,158,11,0.12)'  : 'rgba(52,211,153,0.12)';
                        const iconBorder     = priority === 'high' ? 'rgba(239,68,68,0.3)'    : priority === 'medium' ? 'rgba(245,158,11,0.3)'   : 'rgba(52,211,153,0.3)';
                        const cardBorder     = priority === 'high' ? 'rgba(239,68,68,0.18)'   : priority === 'medium' ? 'rgba(245,158,11,0.18)'  : 'var(--border-glass)';
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '16px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                              <ChevronRight size={14} style={{ color: priorityColor }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: description ? '6px' : '0' }}>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>{action}</p>
                                {priority && (
                                  <span style={{ fontSize: '10px', fontWeight: '700', color: priorityColor, textTransform: 'uppercase', letterSpacing: '0.07em', background: iconBg, border: `1px solid ${iconBorder}`, borderRadius: '20px', padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {priority}
                                  </span>
                                )}
                              </div>
                              {description && (
                                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


              </>
            )}
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
                  readOnly
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Analytics Service URL</label>
                <input 
                  type="text" 
                  className="chat-input"
                  style={{ width: '100%', maxWidth: '500px' }}
                  defaultValue="http://localhost:8000" 
                  readOnly
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Insight Pipeline Threshold</label>
                <input 
                  type="number" 
                  className="chat-input" 
                  style={{ width: '100%', maxWidth: '200px' }}
                  defaultValue="3.0" 
                  readOnly
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
