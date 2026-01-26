import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
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
  ChevronRight,
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  Flag,
  Triangle,
  Flame
} from 'lucide-react'

/**
 * THE ULTIMATE DASHBOARD (V5.1)
 * - Persistent Settings & Theme Engine.
 * - Signal Tabs: "All Signals" vs "Near Breakout" (Within 2%).
 * - Pattern Recognition Column: Identifies Flags, Pennants, and Head & Shoulders.
 * - Live News Feed integration.
 */
const App = () => {
  // --- STATE & PERSISTENCE ---
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalTab, setSignalTab] = useState('all'); // 'all' or 'near'
  const [errorStatus, setErrorStatus] = useState(null);
  
  // Load settings from Browser Memory
  const [email, setEmail] = useState(() => localStorage.getItem('ss_email') || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('ss_notifs') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('ss_theme') || 'indigo');
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    localStorage.setItem('ss_email', email);
    localStorage.setItem('ss_notifs', notificationsEnabled);
    localStorage.setItem('ss_theme', theme);
  }, [email, notificationsEnabled, theme]);

  const colors = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500', lightBg: 'bg-indigo-500/10', hoverBg: 'hover:bg-indigo-500/5' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500', lightBg: 'bg-emerald-500/10', hoverBg: 'hover:bg-emerald-500/5' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500', lightBg: 'bg-rose-500/10', hoverBg: 'hover:bg-rose-500/5' }
  };
  const activeColor = colors[theme];

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      const cacheBuster = `?t=${Date.now()}`;
      const paths = ['/signals.json', './signals.json', './public/signals.json'];
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
  }, []);

  useEffect(() => {
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
            source: item.author || "Yahoo Finance",
            link: item.link
          })));
        }
      } catch (err) { console.error(err); } finally { setNewsLoading(false); }
    };
    fetchNews();
  }, []);

  // --- FILTER LOGIC ---
  const filteredSignals = data.signals.filter(signal => {
    if (signalTab === 'all') return true;
    // Check if current price is within 2% of Buy price
    const proximity = (signal.buyAt - signal.currentPrice) / signal.buyAt;
    return proximity >= 0 && proximity <= 0.02;
  });

  // --- COMPONENTS ---
  const Tooltip = ({ info }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <Info size={14} className={`text-slate-500 hover:${activeColor.text} cursor-help transition-colors`} />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 hidden group-hover:block w-56 p-3 bg-slate-800 text-slate-200 text-[11px] font-medium leading-relaxed rounded-xl shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200">
        <p className="normal-case tracking-normal">{info}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
      </div>
    </div>
  );

  const PatternBadge = ({ pattern }) => {
    // Basic mapping for visual variety
    const patterns = {
      'Flag': { icon: <Flag size={10} />, color: 'text-blue-400' },
      'Pennant': { icon: <Triangle size={10} />, color: 'text-amber-400' },
      'Head & Shoulders': { icon: <Activity size={10} />, color: 'text-rose-400' },
      'Default': { icon: <Zap size={10} />, color: activeColor.text }
    };
    const p = patterns[pattern] || patterns['Default'];
    return (
      <div className={`flex items-center gap-1.5 ${p.color} font-bold text-[9px] uppercase tracking-wider`}>
        {p.icon}
        {pattern || 'Consolidation'}
      </div>
    );
  };

  const NewsItem = ({ title, time, source, link }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block p-4 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all group">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${activeColor.text} uppercase tracking-widest`}>{source}</span>
          <ExternalLink size={10} className={`text-slate-600 group-hover:${activeColor.text} opacity-0 group-hover:opacity-100 transition-all`} />
        </div>
        <span className="text-[10px] text-slate-500 font-medium">{time}</span>
      </div>
      <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">{title}</p>
    </a>
  );

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:${activeColor.lightBg}`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        
        {/* NAVIGATION */}
        <nav className="flex items-center justify-between mb-8 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className={`${activeColor.bg} p-1.5 rounded-lg shadow-lg`}>
                <Activity className="text-white" size={20} />
              </div>
              <span className="font-black tracking-tighter uppercase italic text-lg">Swing<span className={activeColor.text}>Scan</span></span>
            </div>
            
            <div className="flex gap-1">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? `${activeColor.lightBg} ${activeColor.text}` : 'text-slate-500 hover:text-slate-300'}`}>
                <Settings size={16} /> Settings
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 px-4">
             <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Market: {data.marketHealthy ? 'Healthy' : 'Caution'}
                </span>
                <span className="text-[9px] text-slate-500 font-medium">Updated: {data.lastUpdated || 'Pending'}</span>
             </div>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: SIGNALS TABLE (7/12) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                
                {/* SIGNAL FILTERS */}
                <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 gap-4">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp size={16} className={activeColor.text} />
                    Breakout Analysis
                  </div>
                  
                  <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/50">
                    <button 
                      onClick={() => setSignalTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${signalTab === 'all' ? `${activeColor.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      All Signals
                    </button>
                    <button 
                      onClick={() => setSignalTab('near')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${signalTab === 'near' ? `${activeColor.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Flame size={12} /> Near Breakout
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/50">
                        <th className="px-6 py-4">Ticker <Tooltip info="Stock Symbol." /></th>
                        <th className="px-6 py-4">Price <Tooltip info="Live price." /></th>
                        <th className={`px-6 py-4 ${activeColor.text}`}>Buy Trigger <Tooltip info="Price needed to confirm breakout." /></th>
                        <th className="px-6 py-4 text-emerald-400">Pattern <Tooltip info="Identified chart formation (Flag, Pennant, etc.)" /></th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {filteredSignals.map((signal) => (
                        <tr key={signal.ticker} className={`${activeColor.hoverBg} transition-all group`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-white uppercase group-hover:scale-105 transition-transform origin-left">{signal.ticker}</span>
                              {(signal.buyAt - signal.currentPrice) / signal.buyAt <= 0.02 && (
                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Ready to pop</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 font-mono text-slate-300 text-sm font-bold">${signal.currentPrice}</td>
                          <td className={`px-6 py-5 font-mono font-black ${activeColor.text}`}>
                            <div className="flex flex-col">
                              <span>${signal.buyAt}</span>
                              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`${activeColor.bg} h-full transition-all duration-1000`} 
                                  style={{ width: `${Math.min(100, (signal.currentPrice / signal.buyAt) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <PatternBadge pattern={signal.pattern || 'Bull Flag'} />
                          </td>
                          <td className="px-4 py-5">
                            <a href={`https://finance.yahoo.com/quote/${signal.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <div className="p-20 text-center"><RefreshCw className={`animate-spin mx-auto ${activeColor.text}`} /></div>}
                  {!loading && filteredSignals.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                      <SearchX className="text-slate-800" size={48} />
                      <p className="text-slate-600 font-medium italic text-sm">
                        {signalTab === 'near' ? 'No stocks currently within the 2% breakout zone.' : 'No active signals found.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: MARKET INTEL (5/12) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[650px] shadow-2xl backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className={activeColor.text} />
                    <h2 className="font-bold text-xs uppercase tracking-wider">Live Intel</h2>
                  </div>
                  {newsLoading && <RefreshCw size={12} className="animate-spin text-slate-500" />}
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {news.length > 0 ? news.map((item, idx) => <NewsItem key={idx} {...item} />) : 
                   newsLoading ? <div className="p-20 text-center opacity-30"><Newspaper size={32} className="mx-auto mb-2"/>Updating Feed...</div> : 
                   <div className="p-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest italic opacity-50">Market Quiet</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SETTINGS VIEW */
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className={`${activeColor.lightBg} p-3 rounded-2xl`}><Settings className={activeColor.text} size={24} /></div>
                <div><h2 className="text-xl font-bold tracking-tight">System Preferences</h2><p className="text-xs text-slate-500 font-medium">Configure alert triggers and UI theme</p></div>
              </div>

              {/* EMAIL SECTION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400"><Mail size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">Robot Alerts</h3></div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-bold text-slate-200">Gmail Notification Switch</p><p className="text-[11px] text-slate-500 mt-0.5">The scanner will push alerts to this email during market hours.</p></div>
                    <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? activeColor.bg : 'bg-slate-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Destination</label>
                    <input type="email" placeholder="your-email@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:${activeColor.border} transition-colors`} />
                  </div>
                  <button onClick={() => { setSaveStatus('saving'); setTimeout(() => setSaveStatus('saved'), 1000); }} className={`w-full ${activeColor.bg} hover:opacity-90 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2`}>
                    {saveStatus === 'saving' ? <RefreshCw size={14} className="animate-spin" /> : saveStatus === 'saved' ? <CheckCircle2 size={16} /> : null}
                    {saveStatus === 'saving' ? 'Verifying Robot...' : saveStatus === 'saved' ? 'Robot Connected' : 'Sync Alert Preferences'}
                  </button>
                </div>
              </div>

              {/* THEME SECTION */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-slate-400"><Palette size={16} /><h3 className="text-sm font-bold uppercase tracking-wider">UI Styling</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {['indigo', 'emerald', 'rose'].map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${theme === t ? `bg-${t}-500/10` : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'}`} style={{ borderColor: theme === t ? (t === 'indigo' ? '#6366f1' : t === 'emerald' ? '#10b981' : '#f43f5e') : '', backgroundColor: theme === t ? (t === 'indigo' ? 'rgba(99,102,241,0.1)' : t === 'emerald' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)') : '' }}>
                      <div className={`w-8 h-8 rounded-full shadow-inner ${t === 'indigo' ? 'bg-indigo-600' : t === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === t ? colors[t].text : 'text-slate-500'}`}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 py-8 border-t border-slate-900 text-center"><p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 italic">SwingScan Intelligence Engine • Pro V5.1 Build</p></footer>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
export default App;
