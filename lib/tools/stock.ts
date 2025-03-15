import { tool } from 'ai';
import { z } from 'zod';

// Helper function to get cookie on the server side
const getServerCookie = (name: string): string | null => {
  if (typeof document !== 'undefined') {
    // We're in the browser
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  } else {
    // We're on the server
    return null;
  }
};

// Helper function to map our interval to Polygon.io timespan
function mapIntervalToPolygon(interval: string): { timespan: string; multiplier: number; from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0] // Format as YYYY-MM-DD
  let from = new Date()
  let timespan = 'day'
  let multiplier = 1

  switch (interval) {
    case '1d':
      from.setDate(from.getDate() - 1)
      timespan = 'hour'
      multiplier = 1
      break
    case '5d':
      from.setDate(from.getDate() - 5)
      timespan = 'hour'
      multiplier = 1
      break
    case '1mo':
      from.setMonth(from.getMonth() - 1)
      timespan = 'day'
      multiplier = 1
      break
    case '3mo':
      from.setMonth(from.getMonth() - 3)
      timespan = 'day'
      multiplier = 1
      break
    case '6mo':
      from.setMonth(from.getMonth() - 6)
      timespan = 'day'
      multiplier = 1
      break
    case '1y':
      from.setFullYear(from.getFullYear() - 1)
      timespan = 'day'
      multiplier = 1
      break
    case '2y':
      from.setFullYear(from.getFullYear() - 2)
      timespan = 'week'
      multiplier = 1
      break
    case '5y':
      from.setFullYear(from.getFullYear() - 5)
      timespan = 'week'
      multiplier = 1
      break
    case '10y':
      from.setFullYear(from.getFullYear() - 10)
      timespan = 'month'
      multiplier = 1
      break
    case 'ytd':
      from = new Date(now.getFullYear(), 0, 1) // January 1st of current year
      timespan = 'day'
      multiplier = 1
      break
    case 'max':
      from = new Date(2000, 0, 1) // January 1st, 2000 (arbitrary start date)
      timespan = 'month'
      multiplier = 1
      break
    default:
      from.setMonth(from.getMonth() - 1) // Default to 1 month
      timespan = 'day'
      multiplier = 1
  }

  return {
    timespan,
    multiplier,
    from: from.toISOString().split('T')[0], // Format as YYYY-MM-DD
    to
  }
}

// Define the schema for stock data parameters
export const stockDataSchema = z.object({
  symbol: z.string().describe('The stock symbol to get data for (e.g., AAPL, MSFT, GOOGL)'),
  interval: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'])
    .describe('The time interval for the stock data')
    .default('1mo'),
  compare_symbols: z.array(z.string())
    .describe('Additional stock symbols to compare with the main symbol')
    .default([])
})

// Define types for better type safety
type StockDataParams = z.infer<typeof stockDataSchema>

// Define the stock data tool
export const getStockData = tool({
  description: 'Get historical stock price data and display an interactive chart. Use this tool for ANY questions about stocks, stock prices, or stock charts. For example, if asked "Show me a chart of Tesla stock", use this tool with symbol="TSLA".',
  parameters: stockDataSchema,
  execute: async ({ symbol, interval, compare_symbols }: StockDataParams) => {
    try {
      // Check if stock mode is enabled
      const stockMode = getServerCookie('stock-mode');
      if (stockMode === 'false') {
        return {
          content: "Stock mode is disabled. Please enable stock mode in the header to use this feature.",
          ui: null
        };
      }
      
      // Combine all symbols for fetching
      const allSymbols = [symbol, ...compare_symbols].filter(Boolean)
      
      // Get Polygon.io API key from environment variables
      const apiKey = process.env.POLYGON_API_KEY
      if (!apiKey) {
        throw new Error('Polygon API key is not configured')
      }
      
      // Fetch data for each symbol
      const results = await Promise.all(
        allSymbols.map(async (sym) => {
          try {
            // Map interval to Polygon.io parameters
            const { timespan, multiplier, from, to } = mapIntervalToPolygon(interval)
            
            // Fetch stock details
            const detailsResponse = await fetch(
              `https://api.polygon.io/v3/reference/tickers/${sym}?apiKey=${apiKey}`
            )
            
            if (!detailsResponse.ok) {
              console.error(`Failed to fetch stock details for ${sym}: ${detailsResponse.statusText}`)
              return null
            }
            
            const detailsData = await detailsResponse.json()
            
            // Fetch stock aggregates (historical data)
            const aggregatesResponse = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${sym}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`
            )
            
            if (!aggregatesResponse.ok) {
              console.error(`Failed to fetch stock aggregates for ${sym}: ${aggregatesResponse.statusText}`)
              return null
            }
            
            const aggregatesData = await aggregatesResponse.json()
            
            // Fetch previous close
            const prevCloseResponse = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${apiKey}`
            )
            
            let previousClose = null
            if (prevCloseResponse.ok) {
              const prevCloseData = await prevCloseResponse.json()
              if (prevCloseData.results && prevCloseData.results.length > 0) {
                previousClose = prevCloseData.results[0].c
              }
            }
            
            // Format the data
            const prices = aggregatesData.results?.map((bar: any) => {
              // Convert timestamp (milliseconds) to date string
              const date = new Date(bar.t)
              return {
                date: date.toISOString(),
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v
              }
            }) || []
            
            // Get the current price (last close)
            const currentPrice = prices.length > 0 ? prices[prices.length - 1].close : null
            
            // Create the response
            return {
              symbol: sym,
              name: detailsData.results?.name || sym,
              currency: 'USD', // Polygon.io primarily deals with USD
              current_price: currentPrice,
              previous_close: previousClose,
              open: prices.length > 0 ? prices[prices.length - 1].open : null,
              day_high: prices.length > 0 ? prices[prices.length - 1].high : null,
              day_low: prices.length > 0 ? prices[prices.length - 1].low : null,
              fifty_two_week_high: null, // Would need additional API calls
              fifty_two_week_low: null, // Would need additional API calls
              market_cap: null, // Would need additional API calls
              prices: prices
            }
          } catch (error) {
            console.error(`Error fetching data for ${sym}:`, error)
            return null
          }
        })
      )
      
      // Filter out any failed requests
      const validResults = results.filter(Boolean)
      
      if (validResults.length === 0) {
        // Instead of throwing an error, return a more user-friendly message
        return {
          content: `No valid stock data found for the requested symbol(s): ${allSymbols.join(', ')}. Please check the symbol and try again.`,
          ui: null
        }
      }
      
      // Get the valid symbols that we have data for
      const validSymbols = validResults.map(result => result!.symbol)
      
      // Format the data for the chart component
      const chartData = formatChartData(validResults, validSymbols, interval)
      
      // Create the response data
      const responseData = {
        title: `Stock Price${validSymbols.length > 1 ? ' Comparison' : ''}: ${validSymbols.join(', ')}`,
        stock_symbols: validSymbols,
        interval,
        chart: chartData
      }
      
      // Create a text summary of the stock data
      const textSummary = createStockSummary(validResults, validSymbols, interval)
      
      // Return both the text summary and the chart data
      return {
        content: `${textSummary}\n\n\`\`\`json\n${JSON.stringify(responseData, null, 2)}\n\`\`\``,
        ui: {
          type: 'StockChart',
          data: responseData
        }
      }
    } catch (error) {
      console.error('Error in getStockData tool:', error)
      return {
        content: `Failed to get stock data: ${error instanceof Error ? error.message : String(error)}`,
        ui: null
      }
    }
  }
})

// Helper function to format the data for the chart component
function formatChartData(data: any[], symbols: string[], interval: string) {
  // Create chart elements from the data
  const elements = data.map((stockData, index) => {
    // Ensure we have prices data
    if (!stockData.prices || stockData.prices.length === 0) {
      console.warn(`No price data available for ${symbols[index]}`);
      return {
        label: symbols[index],
        points: []
      };
    }
    
    // Format points as [date, price] pairs
    const points = stockData.prices.map((point: { date: string; close: number }) => {
      // Ensure the date is a valid ISO string
      let dateStr = point.date;
      if (typeof dateStr !== 'string') {
        dateStr = new Date(dateStr).toISOString();
      }
      
      // Ensure the close price is a number
      const closePrice = typeof point.close === 'number' ? point.close : parseFloat(point.close);
      
      return [dateStr, closePrice];
    });
    
    return {
      label: symbols[index],
      points
    };
  });
  
  // Log the formatted chart data for debugging
  console.log('Formatted chart data:', {
    type: 'line',
    x_label: 'Date',
    y_label: 'Price',
    x_scale: 'time',
    elements
  });
  
  return {
    type: 'line',
    x_label: 'Date',
    y_label: 'Price',
    x_scale: 'time',
    elements
  };
}

// Helper function to create a text summary of the stock data
function createStockSummary(data: any[], symbols: string[], interval: string) {
  let summary = `# Stock Data for ${symbols.join(', ')}\n\n`
  
  data.forEach((stockData, index) => {
    const symbol = symbols[index]
    const currentPrice = stockData.current_price
    const previousClose = stockData.previous_close
    
    summary += `## ${stockData.name || symbol} (${symbol})\n`
    
    // Check if we have price data
    if (currentPrice !== null && previousClose !== null) {
      const change = currentPrice - previousClose
      const percentChange = (change / previousClose) * 100
      
      summary += `Current Price: $${currentPrice.toFixed(2)}\n`
      summary += `Previous Close: $${previousClose.toFixed(2)}\n`
      summary += `Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)\n`
    } else {
      summary += `Price data unavailable for this stock.\n`
    }
    
    if (stockData.prices && stockData.prices.length > 0) {
      const firstPrice = stockData.prices[0].close
      const lastPrice = stockData.prices[stockData.prices.length - 1].close
      
      if (firstPrice !== null && lastPrice !== null) {
        const periodChange = lastPrice - firstPrice
        const periodPercentChange = (periodChange / firstPrice) * 100
        
        summary += `${getIntervalName(interval)} Change: ${periodChange >= 0 ? '+' : ''}$${periodChange.toFixed(2)} (${periodPercentChange >= 0 ? '+' : ''}${periodPercentChange.toFixed(2)}%)\n\n`
      } else {
        summary += `Historical price data unavailable for this period.\n\n`
      }
    }
  })
  
  return summary
}

// Helper function to get a human-readable name for the interval
function getIntervalName(interval: string) {
  switch (interval) {
    case '1d': return '1 Day'
    case '5d': return '5 Day'
    case '1mo': return '1 Month'
    case '3mo': return '3 Month'
    case '6mo': return '6 Month'
    case '1y': return '1 Year'
    case '2y': return '2 Year'
    case '5y': return '5 Year'
    case '10y': return '10 Year'
    case 'ytd': return 'Year to Date'
    case 'max': return 'Maximum'
    default: return interval
  }
}

// Export the tools
export const stockTools = {
  getStockData
} 