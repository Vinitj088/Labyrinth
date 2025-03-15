'use client';

import { StockChart } from '@/components/stock-chart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockMode } from '@/lib/context/stock-mode-context';
import { getMostLikelyStockSymbol } from '@/lib/utils/stock-symbol-extractor';
import { useEffect, useRef, useState } from 'react';

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
  const [debugData, setDebugData] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [queryText, setQueryText] = useState<string | null>(query || null);
  
  // Use the stock mode context instead of local state
  const { isStockModeEnabled } = useStockMode();
  
  // Use a ref to track if a fetch is in progress to prevent duplicate requests
  const fetchInProgress = useRef(false);
  // Use a ref to store the latest request parameters
  const latestRequest = useRef({ symbol, interval, compareSymbols });

  // Update symbol when initialSymbol or extractedSymbol changes
  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol);
    } else if (extractedSymbol && extractedSymbol !== symbol) {
      setSymbol(extractedSymbol);
    }
  }, [initialSymbol, extractedSymbol]);

  // Fetch data when symbol, interval, compareSymbols, or stock mode changes
  useEffect(() => {
    // Update the latest request parameters
    latestRequest.current = { symbol, interval, compareSymbols };
    
    // Only fetch if we have a symbol, we're not already loading, and stock mode is enabled
    if (symbol && !loading && !fetchInProgress.current && isStockModeEnabled) {
      fetchStockData();
    }
  }, [symbol, interval, compareSymbols, isStockModeEnabled]);

  // Fetch data once when component mounts
  useEffect(() => {
    if (symbol && !chartData && !loading && !fetchInProgress.current && isStockModeEnabled) {
      fetchStockData();
    }
  }, [isStockModeEnabled]);

  const fetchStockData = async () => {
    // If stock mode is disabled or a fetch is already in progress, don't start another one
    if (!isStockModeEnabled || fetchInProgress.current) {
      console.log(`Fetch prevented: stockMode=${isStockModeEnabled}, fetchInProgress=${fetchInProgress.current}`);
      return;
    }
    
    const { symbol: symbolToUse, interval: intervalToUse, compareSymbols: compareToUse } = latestRequest.current;
    
    if (!symbolToUse) {
      setError("No valid stock symbol found in your query");
      return;
    }

    setLoading(true);
    setError(null);
    setDebugData(null);
    setResponseStatus(null);
    fetchInProgress.current = true;

    try {
      // Build the URL with the current parameters
      const compareParam = compareToUse ? `&compare_symbols=${compareToUse}` : '';
      const url = `/api/stock/chart?symbol=${symbolToUse}&interval=${intervalToUse}${compareParam}`;
      console.log('Fetching stock data from:', url);
      
      const response = await fetch(url);
      setResponseStatus(response.status);
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        setDebugData(JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        setError(`Error parsing response: ${responseText.substring(0, 100)}...`);
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch stock data (${response.status})`);
      }
      
      // Check different possible response formats
      if (data.ui?.data) {
        setChartData(data.ui.data);
      } else if (data.content && data.content.includes('```json')) {
        // Try to extract JSON from the content
        const jsonMatch = data.content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const extractedData = JSON.parse(jsonMatch[1].trim());
            if (extractedData.chart && extractedData.stock_symbols) {
              setChartData(extractedData);
            } else {
              setError('Invalid chart data format');
            }
          } catch (err) {
            console.error('Error parsing JSON from content:', err);
            setError(`Error parsing JSON: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          setError('Could not extract JSON data from response');
        }
      } else if (data.chart && data.stock_symbols) {
        // Direct chart data format
        setChartData(data);
      } else {
        setError(`No stock data available for ${symbolToUse}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch stock data for ${symbolToUse}`;
      console.error('Error fetching stock data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

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
            Query: "{queryText}" → Symbol: {symbol}
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
            Query: "{queryText}" → Symbol: {symbol}
          </div>
        )}
        {responseStatus && (
          <div className="text-xs text-muted-foreground">Response status: {responseStatus}</div>
        )}
        {debugData && (
          <div className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
            <pre>{debugData}</pre>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => fetchStockData()}>
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
          Query: "{queryText}" → Symbol: {symbol}
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
      
      {debugData && !chartData && (
        <div className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
          <pre>{debugData}</pre>
        </div>
      )}
      
      {chartData && (
        <div>
          <StockChart data={chartData} />
        </div>
      )}
    </div>
  );
} 