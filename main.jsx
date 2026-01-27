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
  Info,
  Settings as SettingsIcon,
  Newspaper,
  LayoutDashboard,
  Mail,
  Palette,
  Globe,
  CheckCircle2,
  Zap,
  Flag,
  Triangle,
  Flame,
  Star,
  Plus,
  X,
  Eye,
  EyeOff,
  HelpCircle,
  ArrowUpDown,
  Layers,
  Award,
  TrendingDown
} from 'lucide-react';

/**
 * THE ULTIMATE DASHBOARD (V6.6)
 * - Physical Number Rendering: Shows bold, large numbers (1-100) for Power Scores.
 * - Score Rank: Dynamic color system (Gold > Green > Theme).
 * - Numerical Sorting: Fixed engine to prioritize high scores.
 * - Display Limit Slider: Choose how many setups to show in Settings.
 */
const App = () => {
  // --- STATE ---
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalTab, setSignalTab] = useState('all');
  
  // Preferences (Local Persistence)
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('ss_prefs');
    const defaults = {
      theme: 'indigo',
      showNews: true,
      maxStocks: 10,
      watchlist: ['AAPL', 'TSLA', 'NVDA'],
      sortKey: 'score',
      sortOrder: 'desc',
      email: ""
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [newTicker, setNewTicker] = useState("");

  useEffect(() => {
    localStorage.setItem('ss_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const colors = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500', lightBg: 'bg-indigo-500/10', hoverBg: 'hover:bg-indigo-500/5' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500', lightBg: 'bg-emerald-500/10', hoverBg: 'hover:bg-emerald-500/5' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500', lightBg: 'bg-rose-500/10', hoverBg: 'hover:bg-rose-500/5' }
  };
  const activeColor = colors[prefs.theme] || colors.indigo;

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`./signals.json${cacheBuster}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (e) { console.error("Data fetch error:", e); }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!prefs.showNews) return;
    const fetchNews = async () => {
      try {
        const rssUrl = encodeURIComponent('https://finance.yahoo.com/news/rssindex');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const result = await response.json();
        if (result.status === 'ok') setNews(result.items);
      } catch (err) {}
    };
    fetchNews();
  }, [prefs.showNews]);

  // --- LOGIC: FILTER & SORT ---
  const displaySignals = useMemo(() => {
    let filtered = data.signals.filter(signal => {
      const ticker = signal.ticker.toUpperCase().trim();
      if (signalTab === 'all') return true;
      if (signalTab === 'near') {
        const proximity = (signal.buyAt - signal.currentPrice) / signal.buyAt;
        return proximity >= 0 && proximity <= 0.02;
      }
      if (signalTab === 'watchlist') return prefs.watchlist.includes(ticker);
      return true;
    });

    return [...filtered].sort((a, b) => {
      let valA = a[prefs.sortKey];
      let valB = b[prefs.sortKey];

      if (valA === undefined || valA === null || isNaN(valA)) valA = 0;
      if (valB === undefined || valB === null || isNaN(valB)) valB = 0;

      if (prefs.sortKey === 'ticker') {
        return prefs.sortOrder === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      }

      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      return prefs.sortOrder === 'asc' ? numA - numB : numB - numA;
    }).slice(0, prefs.maxStocks);
  }, [data.signals, signalTab, prefs]);

  // --- HELPERS ---
  const formatNum = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    return parseFloat(num).toFixed(2);
  };

  const formatSyncTime = (timestamp) => {
    if (!timestamp) return 'Synced...';
    try {
      const date = new Date(timestamp.replace(' ', 'T') + 'Z'); 
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return timestamp; }
  };

  const PatternBadge = ({ pattern }) => {
    const badgeMap = {
      'bull flag': { label: 'Bull Flag', icon: <Flag size={10} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      'pennant': { label: 'Pennant', icon: <Triangle size={10} />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      'flat base': { label: 'Flat Base', icon: <Layers size={10} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      'trend breakout': { label: 'Trend Breakout', icon: <Zap size={10} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
      'classic breakout': { label: 'Breakout', icon: <Zap size={10} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' }
    };
    const key = (pattern || '').toLowerCase().trim();
    let match = badgeMap[key];
    if (!match) {
        if (key.includes('flag')) match = badgeMap['bull flag'];
        else if (key.includes('pennant')) match = badgeMap['pennant'];
        else if (key.includes('base')) match = badgeMap['flat base'];
        else match = badgeMap['trend breakout'];
    }
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${match.bg} ${match.color} font-black text-[9px] uppercase tracking-wider border border-white/5`}>
        {match.icon} {match.label}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:${activeColor.lightBg}`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        
        {/* TOP NAVIGATION */}
        <nav className="flex items-center justify-between mb-8 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className={`${activeColor.bg} p-1.5 rounded-lg shadow-lg`}><Activity size={20} className="text-white" /></div>
              <span className="font-black tracking-tighter uppercase italic text-lg text-white">Swing<span className={activeColor.text}>Scan</span></span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <SettingsIcon size={16} /> Settings
              </button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end px-4">
             <span className={`text-[10px] font-black uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
               Market: {data.marketHealthy ? 'Healthy' : 'Caution'}
             </span>
             <span className="text-[9px] text-slate-500 font-medium">Synced: {formatSyncTime(data.lastUpdated)}</span>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* MAIN DATA TABLE */}
            <div className={`${prefs.showNews ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-500`}>
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 gap-4">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp size={16} className={activeColor.text} /> 
                    Top Ranked Setups
                  </div>
                  <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/50">
                    {['all', 'near', 'watchlist'].map(tab => (
                      <button key={tab} onClick={() => setSignalTab(tab)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${signalTab === tab ? `${activeColor.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}>
                        {tab === 'near' ? 'Near (2%)' : tab}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/50">
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4">Ticker</th>
                        <th className="px-6 py-4">Price</th>
                        <th className={`px-6 py-4 ${activeColor.text}`}>Buy Trigger</th>
                        <th className="px-6 py-4 text-emerald-400">Target</th>
                        <th className="px-6 py-4">Pattern</th>
                        <th className="px-6 py-4">RSI</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {displaySignals.map((s) => {
                        const score = s.score || 0;
                        const isElite = score >= 90;
                        const isStrong = score >= 70;
                        const isSolid = score >= 50;
                        
                        const scoreColor = isElite 
                          ? 'text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.2)]' 
                          : isStrong
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                            : isSolid
                              ? `${activeColor.text} ${activeColor.lightBg} ${activeColor.border}/30`
                              : 'text-slate-400 bg-slate-800 border-white/5';

                        return (
                          <tr key={s.ticker} className={`${activeColor.hoverBg} transition-all group`}>
                            <td className="px-6 py-5">
                              <div className="flex flex-col items-center justify-center">
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg shadow-inner transition-all ${scoreColor}`}>
                                      {Math.round(score)}
                                  </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-black text-white uppercase text-lg tracking-tight group-hover:scale-105 transition-transform origin-left">{s.ticker}</span>
                                {prefs.watchlist.includes(s.ticker) && <span className={`text-[8px] font-bold ${activeColor.text} uppercase tracking-widest`}>Watched</span>}
                              </div>
                            </td>
                            <td className="px-6 py-5 font-mono text-slate-300 text-sm font-bold">${formatNum(s.currentPrice)}</td>
                            <td className={`px-6 py-5 font-mono font-black ${activeColor.text} text-base`}>${formatNum(s.buyAt)}</td>
                            <td className="px-6 py-5 font-mono font-black text-emerald-400 text-base">${formatNum(s.goal)}</td>
                            <td className="px-6 py-5"><PatternBadge pattern={s.pattern} /></td>
                            <td className="px-6 py-5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.rsi > 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                                  {formatNum(s.rsi)}
                              </span>
                            </td>
                            <td className="px-4 py-5">
                              <a href={`https://finance.yahoo.com/quote/${s.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
                                  <ExternalLink size={16} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {loading && <div className="p-20 text-center"><RefreshCw className={`animate-spin mx-auto ${activeColor.text}`} /></div>}
                  {!loading && displaySignals.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                      <SearchX className="text-slate-800" size={48} />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest text-center">No matching signals found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NEWS PANEL */}
            {prefs.showNews && (
              <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-right duration-500">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[750px] shadow-2xl backdrop-blur-sm">
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2"><Globe size={16} className={activeColor.text} /> Live Intel</div>
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {news.map((n, idx) => (
                      <a key={idx} href={n.link} target="_blank" rel="noreferrer" className="block p-4 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all group">
                        <div className="flex justify-between items-start mb-1 text-[10px]">
                          <span className={`${activeColor.text} font-bold uppercase`}>{n.author || "Finance"}</span>
                          <span className="text-slate-500">{new Date(n.pubDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">{n.title}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SETTINGS VIEW */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className={`${activeColor.lightBg} p-3 rounded-2xl`}><SettingsIcon className={activeColor.text} size={24} /></div>
                <div><h2 className="text-xl font-bold tracking-tight text-white">Dashboard Preferences</h2><p className="text-xs text-slate-500 font-medium">Configure your trading tools</p></div>
              </div>

              {/* WATCHLIST MANAGER */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400"><Star size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">My Watchlist</h3></div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="Add Ticker..." 
                      value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                          if(e.key === 'Enter' && newTicker && !prefs.watchlist.includes(newTicker)){
                              setPrefs({...prefs, watchlist: [...prefs.watchlist, newTicker]});
                              setNewTicker("");
                          }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none text-white uppercase" 
                    />
                    <button onClick={() => { if(newTicker && !prefs.watchlist.includes(newTicker)) setPrefs({...prefs, watchlist: [...prefs.watchlist, newTicker]}); setNewTicker(""); }} className={`${activeColor.bg} px-6 rounded-xl font-bold text-xs uppercase text-white hover:opacity-90 transition-all shadow-lg`}><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prefs.watchlist.map((t) => (
                      <div key={t} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{t}</span>
                        <button onClick={() => setPrefs({...prefs, watchlist: prefs.watchlist.filter(w => w !== t)})} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DISPLAY LIMITS & NEWS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400"><Layers size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Display Limit</h3></div>
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-inner p-6">
                    <div className="flex justify-between font-black text-xs uppercase tracking-widest">
                        <span>Max Stocks</span>
                        <span className={activeColor.text}>{prefs.maxStocks}</span>
                    </div>
                    <input type="range" min="1" max="50" step="1" value={prefs.maxStocks} onChange={(e) => setPrefs({...prefs, maxStocks: Number(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    <p className="text-[9px] text-slate-500 italic text-center font-medium">Rank Top {prefs.maxStocks} Opportunities.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400"><Eye size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Interface</h3></div>
                  <button onClick={() => setPrefs({...prefs, showNews: !prefs.showNews})} className="w-full bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between hover:bg-slate-900/50 transition-colors shadow-inner h-full p-6">
                    <span className="text-sm font-bold text-slate-200">{prefs.showNews ? 'Hide News Feed' : 'Show News Feed'}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${prefs.showNews ? activeColor.bg : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.showNews ? 'left-6' : 'left-1'}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* SORT CONFIG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400"><ArrowUpDown size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Default Rank</h3></div>
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                        <select 
                        value={prefs.sortKey} 
                        onChange={(e) => setPrefs({...prefs, sortKey: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none text-white cursor-pointer appearance-none"
                        >
                            <option value="score">Power Score (1-100)</option>
                            <option value="ticker">Ticker (Alphabetical)</option>
                            <option value="currentPrice">Price (Lowest First)</option>
                            <option value="buyAt">Breakout Trigger</option>
                        </select>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                            <button onClick={() => setPrefs({...prefs, sortOrder: 'asc'})} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${prefs.sortOrder === 'asc' ? `${activeColor.bg} text-white` : 'text-slate-500 hover:text-slate-300'}`}>Asc</button>
                            <button onClick={() => setPrefs({...prefs, sortOrder: 'desc'})} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${prefs.sortOrder === 'desc' ? `${activeColor.bg} text-white` : 'text-slate-500 hover:text-slate-300'}`}>Desc</button>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400"><Palette size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Style</h3></div>
                    <div className="grid grid-cols-3 gap-3 h-full">
                        {['indigo', 'emerald', 'rose'].map((t) => (
                            <button 
                              key={t} onClick={() => setPrefs({...prefs, theme: t})} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${prefs.theme === t ? `border-${t}-500 bg-${t}-500/10` : 'border-slate-800 bg-slate-950'}`}
                            >
                                <div className={`w-6 h-6 rounded-full shadow-inner ${t === 'indigo' ? 'bg-indigo-600' : t === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                <span className={`text-[10px] font-black uppercase ${prefs.theme === t ? colors[t].text : 'text-slate-600'}`}>{t}</span>
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 py-8 border-t border-slate-900 text-center">
            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 italic">SwingScan Intelligence • V6.6 Build</p>
        </footer>
      </div>
    </div>
  );
};

// MOUNTING
const rootElem = document.getElementById('root');
if (rootElem) {
  ReactDOM.createRoot(rootElem).render(<App />);
}

export default App;
