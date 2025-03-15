'use client';

import { StockChart } from '@/components/stock-chart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockMode } from '@/lib/context/stock-mode-context';
import { getMostLikelyStockSymbol } from '@/lib/utils/stock-symbol-extractor';
import { useEffect, useState } from 'react';

interface DirectStockChartProps {
  initialSymbol?: string;
  query?: string;
}

export function DirectStockChart({ initialSymbol, query }: DirectStockChartProps) {
  // Try to extract a stock symbol from the query if provided
  const extractedSymbol = query ? getMostLikelyStockSymbol(query) : null;
  
  const [symbol, setSymbol] = useState(initialSymbol || extractedSymbol || 'AAPL');
  const [interval, setInterval] = useState('1mo');
  const [compareSymbols, setCompareSymbols] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [queryText, setQueryText] = useState<string | null>(query || null);
  
  // Use the stock mode context instead of local state
  const { isStockModeEnabled } = useStockMode();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const compareParam = compareSymbols ? `&compare_symbols=${compareSymbols}` : '';
      const url = `/api/stock/chart?symbol=${symbol}&interval=${interval}${compareParam}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch stock data (${response.status})`);
      }
      
      if (data.ui?.data) {
        setChartData(data.ui.data);
      } else if (data.chart && data.stock_symbols) {
        setChartData(data);
      } else {
        throw new Error(`No stock data available for ${symbol}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when symbol, interval, compareSymbols, or stock mode changes
  useEffect(() => {
    if (!isStockModeEnabled || !symbol) return;
    fetchData();
  }, [symbol, interval, compareSymbols, isStockModeEnabled]);

  // Update symbol when initialSymbol or extractedSymbol changes
  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol);
    } else if (extractedSymbol && extractedSymbol !== symbol) {
      setSymbol(extractedSymbol);
    }
  }, [initialSymbol, extractedSymbol, symbol]);

  // If stock mode is disabled, show a minimal UI instead of returning null
  if (!isStockModeEnabled) {
    return (
      <div className="w-full space-y-4 border border-border rounded-lg p-4 mb-4 text-center">
        <div className="text-sm text-muted-foreground">
          Stock mode is currently disabled. Enable it in the header to use this feature.
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full space-y-4 border border-border rounded-lg p-4 mb-4">
        <div className="text-sm text-muted-foreground">Loading stock data for {symbol}...</div>
        {queryText && (
          <div className="text-xs text-muted-foreground">
            Query: &quot;{queryText}&quot; → Symbol: {symbol}
          </div>
        )}
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="w-full space-y-4 border border-border rounded-lg p-4 mb-4">
        <div className="text-sm text-destructive">{error}</div>
        {queryText && (
          <div className="text-xs text-muted-foreground">
            Query: &quot;{queryText}&quot; → Symbol: {symbol}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 border border-border rounded-lg p-4 mb-4">
      {queryText && (
        <div className="text-xs text-muted-foreground mb-2">
          Query: &quot;{queryText}&quot; → Symbol: {symbol}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Time Interval</Label>
          <Select value={interval} onValueChange={(value) => setInterval(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="5d">5 Days</SelectItem>
              <SelectItem value="1mo">1 Month</SelectItem>
              <SelectItem value="3mo">3 Months</SelectItem>
              <SelectItem value="6mo">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {chartData && (
        <div>
          <StockChart data={chartData} />
        </div>
      )}
    </div>
  );
} 