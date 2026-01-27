# -*- coding: utf-8 -*-
"""
SwingScan Pro V6.6 - Power Ranking & Pattern Engine
This script identifies high-conviction setups and syncs them to the dashboard.
"""

import os
import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import datetime
import urllib.request

# --- POWER RANKING ENGINE ---
def calculate_confluence_score(df, spy_data):
    """
    Calculates a conviction score from 1-100.
    Based on Relative Strength, Volume Intensity, and RSI 'Golden Zones'.
    """
    score = 50 # Start with a neutral base score
    try:
        # 1. Relative Strength vs Market (SPY)
        # Stocks outperforming the S&P 500 over the last 20 trading days
        stock_return = df['Close'].pct_change(20).iloc[-1]
        market_return = spy_data['Close'].pct_change(20).iloc[-1]
        if stock_return > market_return: 
            score += 15

        # 2. Volume Intensity (Buying pressure)
        avg_vol = df['Volume'].tail(20).mean()
        curr_vol = df['Volume'].iloc[-1]
        if curr_vol > (avg_vol * 2.5): 
            score += 20
        elif curr_vol > (avg_vol * 1.5): 
            score += 10

        # 3. RSI 'Golden Zone' (55-65 is the sweet spot for breakout momentum)
        rsi = df['RSI_14'].iloc[-1]
        if 55 <= rsi <= 65: 
            score += 15
    except: 
        pass
    
    # Ensure the final score stays between 1 and 100
    return int(min(max(score, 1), 100))

def identify_pattern(df):
    """
    Looks at the shape of the last 15 days of price action to find specific patterns.
    """
    recent = df.tail(15)
    highs = recent['High']
    lows = recent['Low']
    
    # Pennant: Contracting range (Lower Highs, Higher Lows)
    highs_down = highs.iloc[0] > highs.iloc[-1]
    lows_up = lows.iloc[0] < lows.iloc[-1]
    
    # Bull Flag: Tight consolidation (less than 5% movement) after a strong move
    range_percentage = (highs.max() - lows.min()) / lows.min()
    
    if highs_down and lows_up: 
        return "Pennant"
    if range_percentage < 0.05: 
        return "Bull Flag"
    
    return "Classic Breakout"

def get_full_market_list():
    """Scrapes the S&P 500 and Nasdaq 100 ticker lists from Wikipedia."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        # Get S&P 500
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        # Get Nasdaq 100
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except:
        # Fallback list if scraping fails
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN']
    
    # Clean tickers for yfinance (replace dots with dashes)
    clean_tickers = [str(t).replace('.', '-') for t in tickers if str(t) != 'nan']
    return sorted(list(set(clean_tickers)))

def run_web_scan():
    """Main execution loop that runs the scan and saves to signals.json."""
    all_tickers = get_full_market_list()
    
    # Get benchmark data to calculate Relative Strength
    spy_hist = yf.download("SPY", period="1y", interval="1d", progress=False)
    # Check if market is in a healthy uptrend (Price above 50-day average)
    m_healthy = spy_hist['Close'].iloc[-1] > spy_hist['Close'].rolling(50).mean().iloc[-1]
    
    signals = []
    print(f"🚀 Scanning {len(all_tickers)} stocks for Power Setups...")

    for ticker in all_tickers:
        try:
            data = yf.download(ticker, period="1y", interval="1d", progress=False)
            if data.empty or len(data) < 100: 
                continue
            
            # Clean up multi-index columns if they exist
            if isinstance(data.columns, pd.MultiIndex): 
                data.columns = data.columns.droplevel(1)

            # Add technical indicators
            data['MA50'] = ta.sma(data['Close'], length=50)
            data.ta.rsi(append=True)
            
            curr_price = float(data['Close'].iloc[-1])
            rsi = data['RSI_14'].iloc[-1]
            recent_high = float(data['High'].tail(20).max())

            # Breakout Filter Logic
            if curr_price > data['MA50'].iloc[-1] and 45 < rsi < 70 and m_healthy:
                # If price is within 2% of the recent 20-day high
                if curr_price > (recent_high * 0.98):
                    signals.append({
                        "ticker": str(ticker),
                        "score": calculate_confluence_score(data, spy_hist),
                        "pattern": identify_pattern(data),
                        "currentPrice": round(curr_price, 2),
                        "buyAt": round(recent_high, 2),
                        "goal": round(curr_price * 1.10, 2),
                        "rsi": round(float(rsi), 2)
                    })
        except: 
            continue

    # Sort all found signals by Power Score (Highest conviction first)
    signals = sorted(signals, key=lambda x: x['score'], reverse=True)

    # Ensure the public folder exists for GitHub Actions
    if not os.path.exists('public'): 
        os.makedirs('public')
        
    output_data = {
        "marketHealthy": bool(m_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Save the data file
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Scan Complete. Saved {len(signals)} setups to public/signals.json.")

if __name__ == "__main__":
    run_web_scan()
