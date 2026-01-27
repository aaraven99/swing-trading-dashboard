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
  ShieldAlert
} from 'lucide-react';

/**
 * App.jsx: V9.1 Conservative Dashboard.
 * Displays physical numerical Power Scores and High-Probability Setups.
 */
const App = () => {
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "Never" });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Preferences with Local Storage persistence
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('ss_prefs');
    const defaults = {
      theme: 'indigo',
      maxStocks: 10,
      watchlist: ['AAPL', 'TSLA', 'NVDA'],
      sortKey: 'score',
      sortOrder: 'desc'
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [newTicker, setNewTicker] = useState("");

  useEffect(() => {
    localStorage.setItem('ss_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const activeColor = { text: 'text-indigo-400', bg: 'bg-indigo-600', lightBg: 'bg-indigo-500/10' };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`./signals.json?t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (e) { console.error("Fetch error:", e); }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  const displaySignals = useMemo(() => {
    return [...data.signals].sort((a, b) => {
      let valA = a[prefs.sortKey] || 0;
      let valB = b[prefs.sortKey] || 0;
      return prefs.sortOrder === 'asc' ? valA - valB : valB - valA;
    }).slice(0, prefs.maxStocks);
  }, [data.signals, prefs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        {/* HEADER NAVIGATION */}
        <nav className="flex items-center justify-between mb-10 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <Activity size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Swing<span className="text-indigo-400">Scanner</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <SettingsIcon size={16} /> Settings
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-end px-4">
             <span className={`text-[10px] font-black uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
               Market: {data.marketHealthy ? 'Healthy' : 'Caution'}
             </span>
             <span className="text-[9px] text-slate-500 flex items-center gap-1">
               <Clock size={10} /> {data.lastUpdated}
             </span>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <h3 className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <TrendingUp size={16} className="text-indigo-400" />
                  Top Ranked Setups
                </h3>
                <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-400/20">
                  V9.1 Compounder Logic
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/50">
                      <th className="px-6 py-5 text-center">Score</th>
                      <th className="px-6 py-5">Ticker</th>
                      <th className="px-6 py-5">Buy Limit</th>
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
                        <tr key={s.ticker} className="hover:bg-indigo-500/5 transition-all group">
                          <td className="px-6 py-6">
                            <div className="flex justify-center">
                              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg shadow-inner ${scoreColor}`}>
                                {Math.round(score)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="font-black text-white uppercase text-xl tracking-tighter group-hover:text-indigo-400 transition-colors">{s.ticker}</span>
                          </td>
                          <td className="px-6 py-6 font-mono font-black text-indigo-400 text-lg">${s.buyAt}</td>
                          <td className="px-6 py-6 font-mono font-black text-emerald-400 text-lg">${s.goal}</td>
                          <td className="px-6 py-6 font-mono font-black text-rose-500 text-lg opacity-80">${s.stopLoss}</td>
                          <td className="px-6 py-6">
                             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-[9px] uppercase tracking-wider border border-white/5">
                               <Flag size={10} /> {s.pattern || "Setup"}
                             </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">{s.rsi}</span>
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
                {!loading && displaySignals.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-3">
                    <SearchX className="text-slate-800" size={48} />
                    <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No elite setups found matching criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SETTINGS PANEL */
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-400">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Dashboard Preferences</h2>
                  <p className="text-xs text-slate-500">Calibrated for $500 Account • 20% Growth Goal</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Star size={16}/> My Watchlist
                </h3>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="Add Ticker (e.g. AAPL)..." 
                      value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none text-white" 
                    />
                    <button 
                      onClick={() => { if(newTicker && !prefs.watchlist.includes(newTicker)) setPrefs({...prefs, watchlist: [...prefs.watchlist, newTicker]}); setNewTicker(""); }}
                      className="bg-indigo-600 px-6 rounded-xl text-white font-bold hover:bg-indigo-500 transition-all shadow-lg"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prefs.watchlist.map(t => (
                      <div key={t} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{t}</span>
                        <button onClick={() => setPrefs({...prefs, watchlist: prefs.watchlist.filter(w => w !== t)})} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between font-black text-[10px] uppercase text-slate-400">
                      <span>Display Limit</span>
                      <span className="text-indigo-400">{prefs.maxStocks}</span>
                    </div>
                    <input 
                      type="range" min="1" max="25" value={prefs.maxStocks} 
                      onChange={(e) => setPrefs({...prefs, maxStocks: Number(e.target.value)})} 
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                    />
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between font-black text-[10px] uppercase text-slate-400">
                      <span>Default Sort</span>
                    </div>
                    <select 
                      value={prefs.sortKey} 
                      onChange={(e) => setPrefs({...prefs, sortKey: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                    >
                        <option value="score">Power Score</option>
                        <option value="buyAt">Entry Price</option>
                        <option value="ticker">Ticker Name</option>
                    </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 py-8 border-t border-slate-900 text-center opacity-40">
            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em] italic">
              SwingScan Intelligence • Secure Build V9.1
            </p>
        </footer>
      </div>
    </div>
  );
};

// Mount root for build
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}

export default App;
