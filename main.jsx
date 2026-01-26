import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { 
  Activity, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Clock, 
  ExternalLink,
  SearchX,
  Info,
  Settings,
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
  Layers
} from 'lucide-react'

/**
 * THE ULTIMATE DASHBOARD (V5.8)
 * - Specific Pattern Recognition: Displays Bull Flag, Pennant, Flat Base labels.
 * - Localized Sync Time: Automatically adjusts robot's UTC time to your local clock.
 * - Precision: Forces 2-decimal rounding across all trading metrics.
 * - Persistence: Watchlist, Sort, News-toggle, and Themes saved to browser memory.
 */
const App = () => {
  // --- STATE & PERSISTENCE ---
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalTab, setSignalTab] = useState('all'); 
  const [errorStatus, setErrorStatus] = useState(null);
  
  // Load settings from Browser Memory (localStorage)
  const [email, setEmail] = useState(() => localStorage.getItem('ss_email') || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('ss_notifs') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('ss_theme') || 'indigo');
  const [showNews, setShowNews] = useState(() => localStorage.getItem('ss_show_news') !== 'false'); 
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('ss_watchlist');
    return saved ? JSON.parse(saved) : ['AAPL', 'TSLA', 'NVDA'];
  });
  
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem('ss_sort');
    return saved ? JSON.parse(saved) : { key: 'ticker', order: 'asc' };
  });
  
  const [newTicker, setNewTicker] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem('ss_email', email);
    localStorage.setItem('ss_notifs', notificationsEnabled);
    localStorage.setItem('ss_theme', theme);
    localStorage.setItem('ss_show_news', showNews);
    localStorage.setItem('ss_watchlist', JSON.stringify(watchlist));
    localStorage.setItem('ss_sort', JSON.stringify(sortConfig));
  }, [email, notificationsEnabled, theme, showNews, watchlist, sortConfig]);

  const colors = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500', lightBg: 'bg-indigo-500/10', hoverBg: 'hover:bg-indigo-500/5' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500', lightBg: 'bg-emerald-500/10', hoverBg: 'hover:bg-emerald-500/5' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500', lightBg: 'bg-rose-500/10', hoverBg: 'hover:bg-rose-500/5' }
  };
  const activeColor = colors[theme];

  // Helper for 2-decimal rounding
  const formatNum = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    return parseFloat(num).toFixed(2);
  };

  // Helper to convert UTC timestamp from robot to Local Time
  const formatSyncTime = (timestamp) => {
    if (!timestamp) return 'Connecting...';
    try {
      const date = new Date(timestamp.replace(' ', 'T') + 'Z'); 
      if (isNaN(date.getTime())) return timestamp;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return timestamp; }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      const cacheBuster = `?t=${Date.now()}`;
      const paths = ['./signals.json', '/signals.json', './public/signals.json'];
      let success = false;
      for (const path of paths) {
        try {
          const response = await fetch(path + cacheBuster);
          if (response.ok) {
            const result = await response.json();
            setData(result);
            setErrorStatus(null);
            success = true;
            break; 
          }
        } catch (e) { continue; }
      }
      if (!success) setErrorStatus("NO_DATA_FOUND");
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showNews) return;
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const rssUrl = encodeURIComponent('https://finance.yahoo.com/news/rssindex');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const result = await response.json();
        if (result.status === 'ok') {
          setNews(result.items.map(item => ({
            title: item.title,
            time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: item.author || "Finance",
            link: item.link
          })));
        }
      } catch (err) { } finally { setNewsLoading(false); }
    };
    fetchNews();
  }, [showNews]);

  // --- FILTER & SORT LOGIC ---
  const getFilteredAndSortedSignals = () => {
    let filtered = data.signals.filter(signal => {
      const ticker = signal.ticker.toUpperCase().trim();
      if (signalTab === 'all') return true;
      if (signalTab === 'near') {
        const proximity = (signal.buyAt - signal.currentPrice) / signal.buyAt;
        return proximity >= 0 && proximity <= 0.02;
      }
      if (signalTab === 'watchlist') {
        return watchlist.map(t => t.toUpperCase().trim()).includes(ticker);
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === 'ticker') {
        return sortConfig.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
      return sortConfig.order === 'asc' ? valA - valB : valB - valA;
    });
  };

  const displaySignals = getFilteredAndSortedSignals();

  const addToWatchlist = () => {
    const cleanTicker = newTicker.trim().toUpperCase();
    if (cleanTicker && !watchlist.includes(cleanTicker)) {
      setWatchlist([...watchlist, cleanTicker]);
      setNewTicker("");
    }
  };

  const removeFromWatchlist = (ticker) => setWatchlist(watchlist.filter(t => t !== ticker));

  // --- UI COMPONENTS ---
  const Tooltip = ({ info }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <Info size={14} className={`text-slate-500 hover:${activeColor.text} cursor-help transition-colors`} />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 hidden group-hover:block w-56 p-3 bg-slate-800 text-slate-200 text-[11px] font-medium leading-relaxed rounded-xl shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200">
        <p className="normal-case tracking-normal font-sans">{info}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
      </div>
    </div>
  );

  const PatternBadge = ({ pattern }) => {
    const patterns = {
      'Bull Flag': { icon: <Flag size={10} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      'Pennant': { icon: <Triangle size={10} />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      'Flat Base': { icon: <Layers size={10} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      'Trend Breakout': { icon: <Zap size={10} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' }
    };
    
    const label = pattern && patterns[pattern] ? pattern : 'Trend Breakout';
    const p = patterns[label];

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${p.bg} ${p.color} font-black text-[9px] uppercase tracking-wider shadow-sm border border-white/5`}>
        {p.icon}
        {label}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:${activeColor.lightBg}`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        
        {/* NAV BAR */}
        <nav className="flex items-center justify-between mb-8 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className={`${activeColor.bg} p-1.5 rounded-lg shadow-lg`}><Activity size={20} className="text-white" /></div>
              <span className="font-black tracking-tighter uppercase italic text-lg text-white">Swing<span className={activeColor.text}>Scan</span></span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}><LayoutDashboard size={16} /> Dashboard</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}><Settings size={16} /> Settings</button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end px-4">
             <span className={`text-[10px] font-black uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>Market: {data.marketHealthy ? 'Safe' : 'Caution'}</span>
             <span className="text-[9px] text-slate-500 font-medium tracking-tight">Sync: {formatSyncTime(data.lastUpdated)}</span>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: MAIN SIGNALS TABLE */}
            <div className={`${showNews ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-500`}>
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                
                <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 gap-4">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider"><TrendingUp size={16} className={activeColor.text} /> Breakout Analysis</div>
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
                      {displaySignals.map((signal) => (
                        <tr key={signal.ticker} className={`${activeColor.hoverBg} transition-all group`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-white uppercase text-lg tracking-tight group-hover:scale-105 transition-transform origin-left">{signal.ticker}</span>
                              {watchlist.map(w => w.toUpperCase()).includes(signal.ticker.toUpperCase()) && <span className={`text-[8px] font-bold ${activeColor.text} uppercase tracking-widest`}>Watching</span>}
                            </div>
                          </td>
                          <td className="px-6 py-5 font-mono text-slate-300 text-sm font-bold">${formatNum(signal.currentPrice)}</td>
                          <td className={`px-6 py-5 font-mono font-black ${activeColor.text} text-base`}>${formatNum(signal.buyAt)}</td>
                          <td className="px-6 py-5 font-mono font-black text-emerald-400 text-base">${formatNum(signal.goal)}</td>
                          <td className="px-6 py-5"><PatternBadge pattern={signal.pattern} /></td>
                          <td className="px-6 py-5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${signal.rsi > 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>{formatNum(signal.rsi)}</span></td>
                          <td className="px-4 py-5"><a href={`https://finance.yahoo.com/quote/${signal.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors"><ExternalLink size={16} /></a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <div className="p-20 text-center"><RefreshCw className={`animate-spin mx-auto ${activeColor.text}`} /></div>}
                  {!loading && displaySignals.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                      <SearchX className="text-slate-800" size={48} />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest text-center">No matching signals found</p>
                      <p className="text-slate-600 text-[11px] max-w-xs mx-auto text-center leading-relaxed italic">Wait for the robot's next scan or try adding more tickers to your watchlist!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: OPTIONAL NEWS FEED */}
            {showNews && (
              <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-right duration-500">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[700px] shadow-2xl backdrop-blur-sm">
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                    <div className="flex items-center gap-2"><Globe size={16} className={activeColor.text} /><h2 className="font-bold text-xs uppercase tracking-wider text-white">Live Intel</h2></div>
                    {newsLoading && <RefreshCw size={12} className="animate-spin text-slate-500" />}
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {news.map((item, idx) => (
                      <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="block p-4 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-bold ${activeColor.text} uppercase tracking-widest`}>{item.source}</span>
                          <span className="text-[10px] text-slate-500">{item.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">{item.title}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SETTINGS PANEL */
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className={`${activeColor.lightBg} p-3 rounded-2xl`}><Settings className={activeColor.text} size={24} /></div>
                <div><h2 className="text-xl font-bold tracking-tight text-white">Preferences</h2><p className="text-xs text-slate-500 font-medium">Control watchlist, sorting, and UI styling</p></div>
              </div>

              {/* SORT CONFIG */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400"><ArrowUpDown size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Default Sort</h3></div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select value={sortConfig.key} onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 cursor-pointer">
                    <option value="ticker">Ticker</option>
                    <option value="currentPrice">Price</option>
                    <option value="buyAt">Breakout Price</option>
                    <option value="goal">Target</option>
                    <option value="rsi">RSI</option>
                  </select>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setSortConfig({ ...sortConfig, order: 'asc' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sortConfig.order === 'asc' ? `${activeColor.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}>Asc</button>
                    <button onClick={() => setSortConfig({ ...sortConfig, order: 'desc' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sortConfig.order === 'desc' ? `${activeColor.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}>Desc</button>
                  </div>
                </div>
              </div>

              {/* WATCHLIST MANAGER */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400"><Star size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">My Watchlist</h3></div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add Ticker (e.g. MSFT)" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 uppercase text-slate-200" />
                    <button onClick={addToWatchlist} className={`${activeColor.bg} px-6 rounded-xl font-bold text-xs uppercase hover:opacity-90 shadow-lg flex items-center gap-2 text-white`}><Plus size={16} /> Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchlist.map((ticker) => (
                      <div key={ticker} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 group animate-in zoom-in-95">
                        <span className="font-bold text-xs text-slate-200">{ticker}</span>
                        <button onClick={() => removeFromWatchlist(ticker)} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* VIEW MODE & ALERTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {showNews ? <Eye size={18} className={activeColor.text}/> : <EyeOff size={18} className="text-slate-600"/>}
                      <span className="text-sm font-bold text-slate-200">Show Market News</span>
                    </div>
                    <button onClick={() => setShowNews(!showNews)} className={`w-12 h-6 rounded-full transition-all relative ${showNews ? activeColor.bg : 'bg-slate-800'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showNews ? 'left-7' : 'left-1'}`} /></button>
                  </div>
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200">Email Alerts</span>
                    <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? activeColor.bg : 'bg-slate-800'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} /></button>
                  </div>
              </div>

              {/* THEMES */}
              <div className="grid grid-cols-3 gap-4">
                  {['indigo', 'emerald', 'rose'].map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${theme === t ? `border-${t}-500 bg-${t}-500/10` : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'}`} style={{ borderColor: theme === t ? (t === 'indigo' ? '#6366f1' : t === 'emerald' ? '#10b981' : '#f43f5e') : '', backgroundColor: theme === t ? (t === 'indigo' ? 'rgba(99,102,241,0.1)' : t === 'emerald' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)') : '' }}>
                      <div className={`w-8 h-8 rounded-full shadow-inner ${t === 'indigo' ? 'bg-indigo-600' : t === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === t ? colors[t].text : 'text-slate-500'}`}>{t}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 py-8 border-t border-slate-900 text-center"><p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 italic">SwingScan Intelligence Engine • V5.8 Build</p></footer>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
export default App;
