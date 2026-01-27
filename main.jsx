import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Clock, 
  ExternalLink,
  SearchX,
  Settings as SettingsIcon,
  LayoutDashboard,
  Zap,
  Flag,
  Star,
  Plus,
  X,
  ShieldAlert,
  Newspaper,
  Palette,
  Eye,
  CheckCircle2,
  AlertCircle,
  ListFilter
} from 'lucide-react';

/**
 * App.jsx: V9.1 Ultra Dashboard.
 * Restoration of all features + Rescan functionality + Tabbed List View.
 * Responsive Full-Screen Layout: Dashboard expands when News Feed is off.
 */
const App = () => {
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "Never" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listFilter, setListFilter] = useState('top'); // 'top' or 'watchlist'
  
  // Preferences with ALL features restored
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('ss_prefs_v9');
    const defaults = {
      theme: 'indigo',
      showNews: true,
      maxStocks: 10,
      watchlist: ['AAPL', 'NVDA', 'UPS', 'PKG', 'DHR'],
      sortKey: 'score',
      sortOrder: 'desc'
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [newTicker, setNewTicker] = useState("");

  useEffect(() => {
    localStorage.setItem('ss_prefs_v9', JSON.stringify(prefs));
  }, [prefs]);

  // Color Mapping for Themes
  const themeColors = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500/30', lightBg: 'bg-indigo-500/10', shadow: 'shadow-indigo-500/20' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500/30', lightBg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/20' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500/30', lightBg: 'bg-rose-500/10', shadow: 'shadow-rose-500/20' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-600', border: 'border-amber-500/30', lightBg: 'bg-amber-500/10', shadow: 'shadow-amber-500/20' },
    slate: { text: 'text-slate-200', bg: 'bg-slate-600', border: 'border-slate-500/30', lightBg: 'bg-slate-500/10', shadow: 'shadow-slate-500/20' }
  };

  const activeTheme = themeColors[prefs.theme] || themeColors.indigo;

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`./signals.json?t=${Date.now()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (e) { 
      console.error("Fetch error:", e); 
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        setLoading(false);
      }, 800);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); 
    return () => clearInterval(interval);
  }, []);

  const displaySignals = useMemo(() => {
    let baseData = [...data.signals];

    // Apply Tab Filtering
    if (listFilter === 'watchlist') {
      baseData = baseData.filter(s => prefs.watchlist.includes(s.ticker.toUpperCase()));
    }

    // Apply Sorting
    const sorted = baseData.sort((a, b) => {
      let valA = a[prefs.sortKey] || 0;
      let valB = b[prefs.sortKey] || 0;
      return prefs.sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // Apply Slicing (Only for "Top" tab, watchlist shows all matches)
    return listFilter === 'top' ? sorted.slice(0, prefs.maxStocks) : sorted;
  }, [data.signals, prefs, listFilter]);

  const handleRescan = () => {
    fetchData();
    console.log("Rescan triggered. Refreshing local data...");
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 transition-colors duration-500`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6 md:px-8">
        
        {/* HEADER NAVIGATION */}
        <nav className="flex flex-col md:flex-row items-center justify-between mb-8 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-md gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className={`${activeTheme.bg} p-2 rounded-xl shadow-lg ${activeTheme.shadow}`}>
                <Activity size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Swing<span className={activeTheme.text}>Scanner</span>
              </h1>
            </div>
            <div className="flex gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800/30">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? `${activeTheme.lightBg} ${activeTheme.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? `${activeTheme.lightBg} ${activeTheme.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <SettingsIcon size={16} /> Settings
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-4">
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Market: {data.marketHealthy ? 'Healthy' : 'Caution'}
                  </span>
                  <button 
                    onClick={handleRescan}
                    className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
                    title="Rescan Market Data"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {data.lastUpdated}
                </span>
             </div>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className={`grid grid-cols-1 ${prefs.showNews ? 'xl:grid-cols-4' : 'xl:grid-cols-1'} gap-8`}>
            {/* MAIN CONTENT */}
            <div className={`${prefs.showNews ? 'xl:col-span-3' : 'xl:col-span-1'} space-y-8`}>
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-900/60 gap-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className={activeTheme.text} />
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wide text-sm">Signal Explorer</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Calibrated for $500 Account • V9.1 Logic</p>
                    </div>
                  </div>

                  {/* LIST TABS */}
                  <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/50">
                    <button 
                      onClick={() => setListFilter('top')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${listFilter === 'top' ? `${activeTheme.bg} text-white` : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Zap size={12} /> Top Picks
                    </button>
                    <button 
                      onClick={() => setListFilter('watchlist')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${listFilter === 'watchlist' ? `${activeTheme.bg} text-white` : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Star size={12} /> Watchlist
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                        <th className="px-6 py-5 text-center">Score</th>
                        <th className="px-6 py-5">Ticker</th>
                        <th className="px-6 py-5 text-indigo-400">Buy Limit</th>
                        <th className="px-6 py-5 text-emerald-400">Target</th>
                        <th className="px-6 py-5 text-rose-500">Stop Loss</th>
                        <th className="px-6 py-5">Pattern</th>
                        <th className="px-6 py-5">RSI</th>
                        <th className="px-6 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {displaySignals.map((s) => {
                        const score = s.score || 0;
                        const scoreColor = score >= 90 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' : 
                                         score >= 80 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 
                                         'text-slate-400 border-white/5 bg-slate-800';
                        
                        return (
                          <tr key={s.ticker} className={`hover:${activeTheme.lightBg} transition-all group`}>
                            <td className="px-6 py-6">
                              <div className="flex justify-center">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg shadow-inner ${scoreColor}`}>
                                  {Math.round(score)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-black text-white uppercase text-xl tracking-tighter group-hover:text-indigo-400 transition-colors">{s.ticker}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">NYSE/NASDAQ</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-mono font-black text-indigo-400 text-lg tracking-tight">${s.buyAt}</td>
                            <td className="px-6 py-6 font-mono font-black text-emerald-400 text-lg tracking-tight">${s.goal}</td>
                            <td className="px-6 py-6 font-mono font-black text-rose-500 text-lg opacity-80 tracking-tight">${s.stopLoss}</td>
                            <td className="px-6 py-6">
                               <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${activeTheme.lightBg} ${activeTheme.text} font-black text-[9px] uppercase tracking-wider border border-white/5`}>
                                 <Flag size={10} /> {s.pattern || "Setup"}
                               </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${s.rsi > 70 ? 'bg-rose-500' : s.rsi < 30 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{width: `${s.rsi}%`}}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{Math.round(s.rsi)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <a href={`https://finance.yahoo.com/quote/${s.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
                                <ExternalLink size={18} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {displaySignals.length === 0 && !loading && (
                    <div className="p-24 text-center flex flex-col items-center gap-4 opacity-40">
                      <SearchX size={64} className="text-slate-700" />
                      <div className="space-y-1">
                        <p className="font-black uppercase text-sm tracking-[0.2em]">
                          {listFilter === 'watchlist' ? 'Watchlist Tickers Not Found' : 'No Matches Found'}
                        </p>
                        <p className="text-xs max-w-xs mx-auto">
                          {listFilter === 'watchlist' 
                            ? "None of your watchlist items currently pass the trend-following filters for a valid signal." 
                            : "Adjust your settings or check back later."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR NEWS FEED ONLY */}
            {prefs.showNews && (
              <div className="space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-300 uppercase tracking-wide text-xs flex items-center gap-2">
                      <Newspaper size={16} className={activeTheme.text} />
                      Market Intelligence
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 space-y-2">
                      <span className="text-[10px] font-black uppercase text-indigo-400">Broad Market</span>
                      <p className="text-xs leading-relaxed text-slate-400 font-medium">
                        {data.marketHealthy 
                          ? "Markets trending above 200MA. Bullish regime active. Focus on high-relative strength breakouts." 
                          : "Market health indicator showing weakness. Tighter stop losses and higher strictness recommended."}
                      </p>
                    </div>
                    {data.signals.slice(0, 2).map(s => (
                      <div key={s.ticker} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-400">{s.ticker} Alert</span>
                        <p className="text-xs leading-relaxed text-slate-400 font-medium">
                          Identified as a <strong>{s.pattern}</strong>. Relative strength is hitting local highs compared to SPY.
                        </p>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all">
                        View All Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SETTINGS PANEL */
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-10 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4 pb-8 border-b border-slate-800">
                <div className={`${activeTheme.lightBg} p-4 rounded-2xl ${activeTheme.text}`}>
                  <SettingsIcon size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Scanner Settings</h2>
                  <p className="text-xs text-slate-500 font-medium">Customize your trading environment • Build V9.1</p>
                </div>
              </div>

              {/* THEME SELECTOR */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Palette size={16} className={activeTheme.text} /> Visual Theme
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.keys(themeColors).map(t => (
                    <button 
                      key={t}
                      onClick={() => setPrefs({...prefs, theme: t})}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${prefs.theme === t ? `border-white ${themeColors[t].bg}` : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border border-white/20 ${themeColors[t].bg}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-tighter">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* WATCHLIST & FEED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" /> Watchlist Control
                  </h3>
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="ADD TICKER..." 
                        value={newTicker} 
                        onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && (newTicker && !prefs.watchlist.includes(newTicker)) && (setPrefs({...prefs, watchlist: [...prefs.watchlist, newTicker]}), setNewTicker(""))}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none text-white font-bold placeholder:text-slate-700" 
                      />
                      <button 
                        onClick={() => { if(newTicker && !prefs.watchlist.includes(newTicker)) setPrefs({...prefs, watchlist: [...prefs.watchlist, newTicker]}); setNewTicker(""); }}
                        className={`${activeTheme.bg} px-6 rounded-xl text-white font-black shadow-lg transition-transform active:scale-95`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prefs.watchlist.map(t => (
                        <div key={t} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 group">
                          <span className="font-black text-xs text-white uppercase">{t}</span>
                          <button onClick={() => setPrefs({...prefs, watchlist: prefs.watchlist.filter(w => w !== t)})} className="text-slate-600 hover:text-rose-500"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-500" /> Preferences
                  </h3>
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">News Feed</span>
                        <span className="text-[9px] text-slate-500 uppercase">Toggle side-panel intelligence</span>
                      </div>
                      <button 
                        onClick={() => setPrefs({...prefs, showNews: !prefs.showNews})}
                        className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${prefs.showNews ? activeTheme.bg : 'bg-slate-800'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${prefs.showNews ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between font-black text-[10px] uppercase text-slate-400">
                        <span>Signal Limit</span>
                        <span className={activeTheme.text}>{prefs.maxStocks}</span>
                      </div>
                      <input 
                        type="range" min="1" max="50" value={prefs.maxStocks} 
                        onChange={(e) => setPrefs({...prefs, maxStocks: Number(e.target.value)})} 
                        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500`} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 pb-12 text-center">
            <div className="flex justify-center gap-8 mb-4 opacity-30">
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Knowledge</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">VCP Core</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary</span>
            </div>
            <p className="text-slate-700 text-[9px] uppercase font-bold tracking-[0.5em] italic">
              Institutional Grade Market Scanner • Version 9.1 Stable
            </p>
        </footer>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}

export default App;
