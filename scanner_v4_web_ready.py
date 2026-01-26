# -*- coding: utf-8 -*-
"""
Scanner V4.1 - Pattern Recognition Version
This script identifies specific chart patterns like Bull Flags and Pennants.
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
AUTO_EMAIL = os.environ.get('TRADING_EMAIL', "")
AUTO_APP_PASSWORD = os.environ.get('TRADING_PASSWORD', "")

def get_full_market_list():
    """Scrapes the S&P 500 and Nasdaq 100 ticker lists."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except:
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'SPY', 'QQQ']
    
    clean_tickers = [str(t).replace('.', '-') for t in tickers if str(t) != 'nan']
    return sorted(list(set(clean_tickers)))

def get_market_health():
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
    Heuristic pattern recognition based on price action.
    """
    recent = df.tail(20)
    volatility = (recent['High'] - recent['Low']).mean()
    tightness = (recent['High'].max() - recent['Low'].min()) / recent['Close'].mean()
    
    # 1. Bull Flag logic: Strong move up then tight consolidation
    prev_move = (df['Close'].iloc[-5] - df['Close'].iloc[-20]) / df['Close'].iloc[-20]
    last_5_days_range = (recent['High'].tail(5).max() - recent['Low'].tail(5).min())
    
    if prev_move > 0.05 and last_5_days_range < (volatility * 1.2):
        return "Bull Flag"
    
    # 2. Pennant logic: Range is contracting significantly
    first_half_range = recent['High'].head(10).max() - recent['Low'].head(10).min()
    second_half_range = recent['High'].tail(10).max() - recent['Low'].tail(10).min()
    
    if second_half_range < (first_half_range * 0.7):
        return "Pennant"
    
    # 3. Flat Base / Consolidation
    if tightness < 0.04:
        return "Flat Base"
        
    return "Trend Breakout"

def detect_signals(df, ticker, market_healthy):
    if len(df) < 60: return None
    
    close = df['Close']
    current_price = float(close.iloc[-1])
    ma50 = df['MA50'].iloc[-1]
    rsi = df['RSI_14'].iloc[-1]
    
    if current_price > ma50 and 40 < rsi < 68 and market_healthy:
        recent_high = float(df['High'].tail(20).max())
        if current_price > (recent_high * 0.96):
            # NEW: Identify the specific pattern
            pattern_name = identify_pattern(df)
            
            return {
                "ticker": str(ticker),
                "pattern": pattern_name,
                "currentPrice": float(round(current_price, 2)),
                "buyAt": float(round(recent_high, 2)),
                "goal": float(round(current_price * 1.10, 2)), 
                "stopLoss": float(round(current_price * 0.95, 2)), 
                "rsi": float(round(rsi, 2)),
                "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            }
    return None

def run_web_scan():
    all_tickers = get_full_market_list()
    market_healthy = get_market_health()
    signals = []
    
    print(f"🚀 Scanning {len(all_tickers)} stocks for patterns...")
    
    for ticker in all_tickers:
        try:
            t_obj = yf.Ticker(ticker)
            data = t_obj.history(period="1y")
            if data.empty: continue
            if isinstance(data.columns, pd.MultiIndex): data.columns = data.columns.droplevel(1)
            
            data['MA50'] = ta.sma(data['Close'], length=50)
            data.ta.rsi(append=True)
            
            signal = detect_signals(data, ticker, market_healthy)
            if signal:
                signals.append(signal)
                print(f"🎯 Found {signal['pattern']}: {ticker}")
        except: continue

    if not os.path.exists('public'): os.makedirs('public')
    output_data = {
        "marketHealthy": bool(market_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
    print(f"✅ Saved {len(signals)} signals.")

if __name__ == "__main__":
    run_web_scan()
