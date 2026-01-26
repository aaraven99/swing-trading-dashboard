import React, { useState, useEffect } from 'react'

import ReactDOM from 'react-dom/client'

import { 

  Activity, 

  TrendingUp, 

  ShieldAlert, 

  Target, 

  RefreshCw, 

  Clock, 

  ExternalLink 

} from 'lucide-react'



/**

 * MAIN DASHBOARD COMPONENT

 * This code handles fetching the signals and building the table UI.

 */

const App = () => {

  const [data, setData] = useState({ marketHealthy: true, signals: [], lastUpdated: "" });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);



  useEffect(() => {

    const fetchData = async () => {

      // The cacheBuster makes sure the browser doesn't show "yesterday's" data

      const cacheBuster = '?t=' + new Date().getTime();

      

      // We check multiple locations just in case

      const paths = ['./signals.json', '/signals.json', './public/signals.json'];

      

      let foundData = false;

      for (const path of paths) {

        try {

          const response = await fetch(path + cacheBuster);

          if (response.ok) {

            const result = await response.json();

            setData(result);

            setError(false);

            foundData = true;

            break; 

          }

        } catch (err) {

          continue;

        }

      }



      if (!foundData) setError(true);

      setLoading(false);

    };



    fetchData();

    const interval = setInterval(fetchData, 300000); // Auto-refresh every 5 mins

    return () => clearInterval(interval);

  }, []);



  return (

    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">

        

        {/* HEADER SECTION */}

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

              <span>Last Scan: {data.lastUpdated || "Checking for data..."}</span>

            </div>

          </div>

          

          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${data.marketHealthy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>

            <div className={`w-2.5 h-2.5 rounded-full ${data.marketHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />

            <span className="font-bold text-xs uppercase tracking-widest text-center">

              Market Health: {data.marketHealthy ? 'SAFE (Uptrend)' : 'CAUTION (Downtrend)'}

            </span>

          </div>

        </header>



        {/* CONTENT SECTION */}

        <div className="space-y-6">

          {loading && data.signals.length === 0 ? (

            <div className="flex flex-col items-center justify-center p-32 space-y-4">

              <RefreshCw className="animate-spin text-indigo-500" size={48} />

              <p className="text-slate-500 font-medium">Booting up scanner interface...</p>

            </div>

          ) : error && data.signals.length === 0 ? (

            <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-16 text-center">

              <div className="bg-rose-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">

                <ShieldAlert size={32} />

              </div>

              <h3 className="text-xl font-bold text-white mb-2">Awaiting Data From Robot</h3>

              <p className="text-slate-500 max-w-md mx-auto">

                No signals file found yet. Go to your GitHub <b>Actions</b> tab and click <b>Run workflow</b>. Once the robot finishes, this screen will update automatically.

              </p>

            </div>

          ) : (

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">

              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">

                <h3 className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-tighter">

                  <TrendingUp size={18} className="text-indigo-400" />

                  Swing Opportunities

                </h3>

                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg font-bold">

                  {data.signals.length} Stocks Found

                </span>

              </div>

              

              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse min-w-[800px]">

                  <thead>

                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">

                      <th className="px-6 py-5">Ticker</th>

                      <th className="px-6 py-5">Price</th>

                      <th className="px-6 py-5">Buy Limit</th>

                      <th className="px-6 py-5">Target (10%)</th>

                      <th className="px-6 py-5">Stop (5%)</th>

                      <th className="px-6 py-5">RSI</th>

                      <th className="px-6 py-5"></th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-800/50">

                    {data.signals.map((signal) => (

                      <tr key={signal.ticker} className="hover:bg-indigo-500/5 transition-all group">

                        <td className="px-6 py-6">

                          <div className="flex flex-col">

                            <span className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{signal.ticker}</span>

                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Market Alert</span>

                          </div>

                        </td>

                        <td className="px-6 py-6 font-mono font-bold text-slate-300">

                          ${signal.currentPrice}

                        </td>

                        <td className="px-6 py-6 font-mono font-black text-indigo-400">

                          ${signal.buyAt}

                        </td>

                        <td className="px-6 py-6 text-emerald-400 font-mono font-black">

                          ${signal.goal}

                        </td>

                        <td className="px-6 py-6 text-rose-500 font-mono font-black">

                          ${signal.stopLoss}

                        </td>

                        <td className="px-6 py-6">

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${signal.rsi > 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>

                            {signal.rsi}

                          </span>

                        </td>

                        <td className="px-6 py-6 text-right">

                          <a 

                            href={`https://finance.yahoo.com/quote/${signal.ticker}`} 

                            target="_blank" 

                            rel="noreferrer"

                            className="text-slate-600 hover:text-white"

                          >

                            <ExternalLink size={18} />

                          </a>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

                {data.signals.length === 0 && !loading && !error && (

                  <div className="p-20 text-center text-slate-500 font-medium">

                    No active setups matched the swing criteria in the last scan.

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

        

        <footer className="mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest text-center md:text-left">

            V4.3 Build • Real-time Scanner Dashboard

          </p>

          <div className="flex gap-6 text-[10px] uppercase font-black text-slate-500 tracking-widest">

            <span className="text-indigo-500/50 italic">Secure Env Active</span>

          </div>

        </footer>

      </div>

    </div>

  );

};



// Entry point: Mounting the App to the index.html root

const rootElement = document.getElementById('root');

if (rootElement) {

  ReactDOM.createRoot(rootElement).render(

    <React.StrictMode>

      <App />

    </React.StrictMode>

  );

}

