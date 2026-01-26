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
  Bell,
  Palette,
  LayoutDashboard,
  Mail,
  ChevronRight
} from 'lucide-react'

/**
 * THE ULTIMATE DASHBOARD (V4.7)
 * - Split View: Signals (Left) / News (Right)
 * - Settings Panel: Gmail & Theme controls
 * - Downward Tooltips
 */
const App = () => {
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorStatus, setErrorStatus] = useState(null);
  
  // Settings State
  const [email, setEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [theme, setTheme] = useState('indigo');

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
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Downward Tooltip Component
  const Tooltip = ({ info }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <Info size={14} className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 hidden group-hover:block w-56 p-3 bg-slate-800 text-slate-200 text-[11px] font-medium leading-relaxed rounded-xl shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200">
        <p className="normal-case tracking-normal">{info}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
      </div>
    </div>
  );

  const NewsItem = ({ title, time, source }) => (
    <div className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{source}</span>
        <span className="text-[10px] text-slate-500 font-medium">{time}</span>
      </div>
      <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">{title}</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30`}>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        
        {/* TOP NAVIGATION BAR */}
        <nav className="flex items-center justify-between mb-8 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Activity className="text-white" size={20} />
              </div>
              <span className="font-black tracking-tighter uppercase italic text-lg">Swing<span className="text-indigo-500">Scan</span></span>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Settings size={16} /> Settings
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 px-4">
             <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${data.marketHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Market: {data.marketHealthy ? 'Safe' : 'Caution'}
                </span>
                <span className="text-[9px] text-slate-500 font-medium">Sync: {data.lastUpdated || 'Offline'}</span>
             </div>
          </div>
        </nav>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: SIGNALS TABLE (8/12 Width) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-400" />
                    <h2 className="font-bold text-sm uppercase tracking-tight">Active Setups</h2>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg font-black uppercase">
                    {data.signals.length} Found
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/50">
                        <th className="px-6 py-4">Ticker <Tooltip info="The stock's market symbol." /></th>
                        <th className="px-6 py-4">Price <Tooltip info="Current live market price." /></th>
                        <th className="px-6 py-4 text-indigo-400">Buy At <Tooltip info="Entry trigger price." /></th>
                        <th className="px-6 py-4 text-emerald-400">Target <Tooltip info="+10% Profit Target." /></th>
                        <th className="px-6 py-4 text-rose-500">Stop <Tooltip info="-5% Loss Protection." /></th>
                        <th className="px-6 py-4">RSI <Tooltip info="Strength indicator (30=Oversold)." /></th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {data.signals.map((signal) => (
                        <tr key={signal.ticker} className="hover:bg-indigo-500/5 transition-all">
                          <td className="px-6 py-5 font-black text-white uppercase">{signal.ticker}</td>
                          <td className="px-6 py-5 font-mono text-slate-300 text-sm font-bold">${signal.currentPrice}</td>
                          <td className="px-6 py-5 font-mono font-black text-indigo-400">${signal.buyAt}</td>
                          <td className="px-6 py-5 font-mono font-black text-emerald-400">${signal.goal}</td>
                          <td className="px-6 py-5 font-mono font-black text-rose-500">${signal.stopLoss}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${signal.rsi > 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                              {signal.rsi}
                            </span>
                          </td>
                          <td className="px-4 py-5">
                            <a href={`https://finance.yahoo.com/quote/${signal.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white"><ExternalLink size={16} /></a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.signals.length === 0 && !loading && (
                    <div className="p-16 text-center text-slate-600 font-medium italic text-sm">No signals detected in this cycle.</div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: NEWS FEED (4/12 Width) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/60">
                  <Newspaper size={16} className="text-indigo-400" />
                  <h2 className="font-bold text-sm uppercase tracking-tight">Market Intel</h2>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <NewsItem source="BLOOMBERG" time="12m ago" title="Federal Reserve signals potential rate holds through Q3" />
                  <NewsItem source="REUTERS" time="24m ago" title="Tech sector rebounds as semiconductor demand surges" />
                  <NewsItem source="CNBC" time="1h ago" title="Retail sales data beats expectations, boosting consumer stocks" />
                  <NewsItem source="YAHOO" time="2h ago" title="NVIDIA reaches new all-time high amid AI expansion news" />
                  <NewsItem source="WSJ" time="3h ago" title="Global markets react to shifting energy price forecasts" />
                  <NewsItem source="FINANCE" time="5h ago" title="Why small-cap stocks are leading the current market rally" />
                  <NewsItem source="MARKETS" time="6h ago" title="Top 5 swing trading opportunities to watch this week" />
                </div>
                <div className="p-4 bg-slate-900/80 text-center border-t border-slate-800">
                  <button className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">View All News</button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* SETTINGS VIEW */
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className="bg-indigo-600/20 p-3 rounded-2xl">
                  <Settings className="text-indigo-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Preferences</h2>
                  <p className="text-xs text-slate-500">Configure notifications and interface themes</p>
                </div>
              </div>

              {/* GMAIL NOTIFICATIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="text-slate-400" size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Email Alerts</h3>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Gmail Notifications</p>
                      <p className="text-xs text-slate-500">Receive an email whenever a High Conviction signal is detected.</p>
                    </div>
                    <button 
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <input 
                    type="email" 
                    placeholder="your-email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Save Email Settings</button>
                </div>
              </div>

              {/* THEME SELECTOR */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Palette className="text-slate-400" size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Dashboard Theme</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {['indigo', 'emerald', 'rose'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${theme === t ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${t === 'indigo' ? 'bg-indigo-600' : t === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 py-8 border-t border-slate-900 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">SwingScan Intelligence Engine • Pro Build V4.7</p>
        </footer>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
export default App;
