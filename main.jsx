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
  Info
} from 'lucide-react'

/**
 * THE ULTIMATE DASHBOARD (V4.6)
 * Featuring Interactive Tooltips for better data interpretation.
 */
const App = () => {
  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

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
        } catch (e) {
          continue;
        }
      }

      if (!success) setErrorStatus("NO_DATA_FOUND");
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5-minute refresh
    return () => clearInterval(interval);
  }, []);

  /**
   * Tooltip Component: Creates a hover-activated info box
   */
  const Tooltip = ({ info }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
      <Info size={14} className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-56 p-3 bg-slate-800 text-slate-200 text-[11px] font-medium leading-relaxed rounded-xl shadow-2xl border border-slate-700 z-50 animate-in fade-in slide-in-from-bottom-1">
        <p className="normal-case tracking-normal">{info}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <Activity className="text-white" size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">
                Swing<span className="text-indigo-500">Scanner</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium ml-1">
              <Clock size={12} />
              <span>{data.lastUpdated ? `Last Sync: ${data.lastUpdated}` : 'Waiting for system...'}</span>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${data.marketHealthy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <div className={`w-2 h-2 rounded-full ${data.marketHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-bold text-[10px] uppercase tracking-widest">
              Market Health: {data.marketHealthy ? 'Safe' : 'Caution'}
              <Tooltip info="Current overall market trend. 'Safe' means indicators suggest a bullish trend suitable for swing entries." />
            </span>
          </div>
        </header>

        {/* MAIN DISPLAY */}
        <div className="space-y-6">
          {loading && data.signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-32 space-y-4">
              <RefreshCw className="animate-spin text-indigo-500" size={48} />
              <p className="text-slate-500 font-medium">Synchronizing scanner...</p>
            </div>
          ) : errorStatus === "NO_DATA_FOUND" ? (
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-16 text-center">
              <div className="bg-indigo-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                <SearchX size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">System Ready — Data Pending</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                The UI is live. Please trigger the scanner on your GitHub Actions tab to populate this dashboard with real-time picks.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm uppercase">
                  <TrendingUp size={16} className="text-indigo-400" />
                  Technical Breakouts
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg font-black uppercase tracking-tighter">
                  {data.signals.length} Setups Found
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/50">
                      <th className="px-6 py-5">
                        Ticker
                        <Tooltip info="The unique stock symbol used to identify the asset on the market." />
                      </th>
                      <th className="px-6 py-5">
                        Price
                        <Tooltip info="The most recent price recorded during the last market scan." />
                      </th>
                      <th className="px-6 py-5 text-indigo-400">
                        Buy At
                        <Tooltip info="Entry trigger. This is the previous candle high. We only enter if the stock moves above this price." />
                      </th>
                      <th className="px-6 py-5 text-emerald-400">
                        Target
                        <Tooltip info="Profit taking goal. This represents a +10% increase from the entry price." />
                      </th>
                      <th className="px-6 py-5 text-rose-500">
                        Stop
                        <Tooltip info="Capital protection level. Exit the trade if the price hits this to limit loss to -5%." />
                      </th>
                      <th className="px-6 py-5">
                        RSI
                        <Tooltip info="Relative Strength Index. Values below 30 suggest oversold, while values above 70 suggest overbought." />
                      </th>
                      <th className="px-6 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {data.signals.map((signal) => (
                      <tr key={signal.ticker} className="hover:bg-indigo-500/5 transition-all group">
                        <td className="px-6 py-6 font-black text-xl text-white uppercase tracking-tighter">
                          {signal.ticker}
                        </td>
                        <td className="px-6 py-6 font-mono text-slate-300 font-bold">${signal.currentPrice}</td>
                        <td className="px-6 py-6 font-mono font-black text-indigo-400 text-lg">${signal.buyAt}</td>
                        <td className="px-6 py-6 font-mono font-black text-emerald-400 text-lg">${signal.goal}</td>
                        <td className="px-6 py-6 font-mono font-black text-rose-500 text-lg">${signal.stopLoss}</td>
                        <td className="px-6 py-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${signal.rsi > 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                            {signal.rsi}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <a href={`https://finance.yahoo.com/quote/${signal.ticker}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
                            <ExternalLink size={18} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.signals.length === 0 && !loading && !errorStatus && (
                  <div className="p-20 text-center text-slate-600 font-medium italic">
                    No active setups matched the swing criteria in the most recent scan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <footer className="mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest text-center md:text-left">
            V4.6 Build • Interactive Scanner Dashboard
          </p>
          <div className="flex gap-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">
            <span className="text-indigo-500/50 italic font-medium">Real-time analysis active</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Mount the App
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
