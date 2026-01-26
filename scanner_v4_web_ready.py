# -*- coding: utf-8 -*-
"""
Scanner V4 - Web Ready Version (JSON Fix)
This script runs the stock scan and saves the results to 'public/signals.json'.
Updated to handle JSON serialization of Numpy types.
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
    """Scrapes the S&P 500 and Nasdaq 100 ticker lists from Wikipedia."""
    print("🔍 Fetching S&P 500 and Nasdaq 100 components...")
    tickers = set()
    
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    
    try:
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
            print(f"✅ Loaded {len(sp500)} S&P 500 tickers.")
            
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
            print(f"✅ Loaded {len(ndx100)} Nasdaq 100 tickers.")
            
    except Exception as e:
        print(f"⚠️ Error scraping lists: {e}. Falling back to comprehensive emergency list.")
        return [
            'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'SPY', 'QQQ',
            'AVGO', 'COST', 'PEP', 'ADBE', 'LIN', 'NFLX', 'INTC', 'TMUS', 'CSCO', 'CMCSA',
            'TXN', 'QCOM', 'AMAT', 'INTU', 'AMGN', 'ISRG', 'HON', 'BKNG', 'MU', 'VRTX',
            'REGN', 'PANW', 'LRCX', 'ADP', 'MDLZ', 'GILD', 'MELI', 'PDD', 'ADI', 'SBUX',
            'BRK-B', 'V', 'JPM', 'UNH', 'MA', 'XOM', 'HD', 'PG', 'JNJ', 'LLY',
            'ABBV', 'CVX', 'MRK', 'MRVL', 'ORCL', 'ABT', 'KO', 'BAC', 'SCHW',
            'TMO', 'DIS', 'WMT', 'MCD', 'PFE', 'IBM', 'GE', 'CAT', 'CRM', 'UBER',
            'NOW', 'AXP', 'GS', 'BA', 'HON', 'AMCR', 'LOW', 'NKE', 'UPS', 'MS',
            'BLK', 'PLTR', 'SNOW', 'MSTR', 'COIN', 'SQ', 'PYPL', 'SHOP', 'CRWD', 'NET'
        ]

    clean_tickers = [str(t).replace('.', '-') for t in tickers if str(t) != 'nan']
    return sorted(list(set(clean_tickers)))

def get_market_health():
    """Checks if the broad market (SPY) is above its 50-day average."""
    try:
        spy = yf.Ticker("SPY")
        hist = spy.history(period="1y")
        if hist.empty: return True
        ma50 = hist['Close'].rolling(window=50).mean()
        # Ensure we return a standard Python bool, not a numpy.bool_
        return bool(hist['Close'].iloc[-1] > ma50.iloc[-1])
    except:
        return True

def detect_signals(df, ticker, market_healthy):
    """Analyzes a single stock for swing trading signals."""
    if len(df) < 60: return None
    
    close = df['Close']
    current_price = float(close.iloc[-1])
    ma50 = df['MA50'].iloc[-1]
    rsi = df['RSI_14'].iloc[-1]
    
    is_trending = bool(current_price > ma50)
    is_rsi_good = bool(40 < rsi < 65)
    
    if is_trending and is_rsi_good and market_healthy:
        recent_high = float(df['High'].tail(20).max())
        if current_price > (recent_high * 0.96):
            # Explicitly convert every number to a float and string to avoid JSON errors
            return {
                "ticker": str(ticker),
                "type": "SWING SETUP",
                "currentPrice": float(round(current_price, 2)),
                "buyAt": float(round(recent_high, 2)),
                "goal": float(round(current_price * 1.10, 2)), 
                "stopLoss": float(round(current_price * 0.95, 2)), 
                "rsi": float(round(rsi, 2)),
                "status": "SWING OPPORTUNITY",
                "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            }
    return None

def run_web_scan():
    """Main function to run the scan and save data for the website."""
    all_tickers = get_full_market_list()
    total_count = len(all_tickers)
    
    print(f"🚀 Starting Scan on {total_count} tickers...")
    market_healthy = get_market_health()
    signals = []
    
    for i, ticker in enumerate(all_tickers):
        if i % 50 == 0 and i > 0:
            print(f"--- Progress: {i}/{total_count} scanned... ---")
            
        try:
            t_obj = yf.Ticker(ticker)
            data = t_obj.history(period="1y", interval="1d")
            if data.empty: continue
            
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.droplevel(1)
            
            data['MA50'] = ta.sma(data['Close'], length=50)
            data.ta.rsi(append=True)
            
            signal = detect_signals(data, ticker, market_healthy)
            if signal:
                signals.append(signal)
                print(f"🎯 Found Signal: {ticker}")
        except:
            continue

    if not os.path.exists('public'):
        os.makedirs('public')

    output_data = {
        "marketHealthy": bool(market_healthy), # Force standard bool
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # This is where the crash was happening - now protected by type conversion
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
    
    print(f"✅ Scan complete! Found {len(signals)} opportunities.")

    if signals and AUTO_EMAIL and AUTO_APP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg['From'], msg['To'] = AUTO_EMAIL, AUTO_EMAIL
            msg['Subject'] = f"📊 Swing Scan: {len(signals)} Opportunities Found"
            
            body = f"Market: {'Healthy' if market_healthy else 'Cautious'}\n\n"
            for s in signals:
                body += f"- {s['ticker']}: Buy ${s['buyAt']} | Goal ${s['goal']}\n"
            
            msg.attach(MIMEText(body, 'plain'))
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(AUTO_EMAIL, AUTO_APP_PASSWORD)
                server.send_message(msg)
        except: pass

if __name__ == "__main__":
    run_web_scan()
