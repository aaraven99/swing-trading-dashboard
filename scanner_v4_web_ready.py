# -*- coding: utf-8 -*-
"""
Scanner V4.2 - Pattern Recognition Engine
This script identifies specific chart setups like Bull Flags and Pennants
for the SwingScan Pro Dashboard.
"""

import os
import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import datetime
import pytz
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CONFIGURATION ---
# These pull from your GitHub Secrets for safety
AUTO_EMAIL = os.environ.get('TRADING_EMAIL', "")
AUTO_APP_PASSWORD = os.environ.get('TRADING_PASSWORD', "")

def get_full_market_list():
    """Scrapes the S&P 500 and Nasdaq 100 ticker lists from Wikipedia."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        # S&P 500
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        # Nasdaq 100
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            # Table index might vary, typically index 4 or 3
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except Exception as e:
        print(f"Scraping error: {e}. Using fallback list.")
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'SPY', 'QQQ']
    
    # Clean tickers for yfinance (replace dots with dashes)
    clean_tickers = [str(t).replace('.', '-') for t in tickers if str(t) != 'nan']
    return sorted(list(set(clean_tickers)))

def get_market_health():
    """Checks if the overall market (SPY) is in a healthy uptrend."""
    try:
        spy = yf.Ticker("SPY")
        hist = spy.history(period="1y")
        if hist.empty: return True
        ma50 = hist['Close'].rolling(window=50).mean()
        return bool(hist['Close'].iloc[-1] > ma50.iloc[-1])
    except:
        return True

def identify_pattern(df):
    """
    Heuristic pattern recognition based on recent price action (last 20 days).
    """
    recent = df.tail(20)
    high_max = recent['High'].max()
    low_min = recent['Low'].min()
    current_close = recent['Close'].iloc[-1]
    
    # Calculate price range tightness
    tightness = (high_max - low_min) / recent['Close'].mean()
    
    # 1. Bull Flag logic: Strong move up (The Pole) then tight consolidation (The Flag)
    pole_move = (df['Close'].iloc[-5] - df['Close'].iloc[-20]) / df['Close'].iloc[-20]
    flag_volatility = (recent['High'].tail(5).max() - recent['Low'].tail(5).min()) / current_close
    
    if pole_move > 0.06 and flag_volatility < 0.03:
        return "Bull Flag"
    
    # 2. Pennant logic: Highs getting lower, Lows getting higher (Squeezing)
    first_half = recent.head(10)
    second_half = recent.tail(10)
    range_1 = first_half['High'].max() - first_half['Low'].min()
    range_2 = second_half['High'].max() - second_half['Low'].min()
    
    if range_2 < (range_1 * 0.65):
        return "Pennant"
    
    # 3. Flat Base: Sustained low volatility horizontal movement
    if tightness < 0.045:
        return "Flat Base"
        
    return "Trend Breakout"

def detect_signals(df, ticker, market_healthy):
    """Checks if a specific stock meets the swing entry criteria."""
    if len(df) < 60: return None
    
    close = df['Close']
    current_price = float(close.iloc[-1])
    ma50 = df['MA50'].iloc[-1]
    rsi = df['RSI_14'].iloc[-1]
    
    # Entrance Criteria: Uptrending, Healthy RSI, and Healthy Market
    if current_price > ma50 and 40 < rsi < 70 and market_healthy:
        recent_high = float(df['High'].tail(20).max())
        
        # Setup trigger: Price is within 4% of the 20-day high
        if current_price > (recent_high * 0.96):
            # Run the shape identifier
            pattern_name = identify_pattern(df)
            
            return {
                "ticker": str(ticker),
                "pattern": pattern_name,
                "currentPrice": round(current_price, 2),
                "buyAt": round(recent_high, 2),
                "goal": round(current_price * 1.10, 2), 
                "stopLoss": round(current_price * 0.95, 2), 
                "rsi": round(rsi, 2)
            }
    return None

def run_web_scan():
    """Main loop to scan the market and save results for the dashboard."""
    all_tickers = get_full_market_list()
    market_healthy = get_market_health()
    signals = []
    
    print(f"🚀 Scanning {len(all_tickers)} stocks for active setups...")
    
    for ticker in all_tickers:
        try:
            t_obj = yf.Ticker(ticker)
            data = t_obj.history(period="1y")
            if data.empty: continue
            
            # Clean up multi-index columns if they exist
            if isinstance(data.columns, pd.MultiIndex): 
                data.columns = data.columns.droplevel(1)
            
            # Add Technical Indicators
            data['MA50'] = ta.sma(data['Close'], length=50)
            data.ta.rsi(append=True)
            
            signal = detect_signals(data, ticker, market_healthy)
            if signal:
                signals.append(signal)
                print(f"🎯 Found {signal['pattern']}: {ticker}")
        except Exception as e:
            continue

    # Ensure the public folder exists for Vercel/GitHub
    if not os.path.exists('public'): 
        os.makedirs('public')
        
    output_data = {
        "marketHealthy": bool(market_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Save the data file
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Scan Complete. {len(signals)} signals saved to public/signals.json")

if __name__ == "__main__":
    run_web_scan()
