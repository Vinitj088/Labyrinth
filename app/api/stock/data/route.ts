import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30 // Set max duration to 30 seconds

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check if stock mode is enabled from the cookie in the request
    const stockMode = req.cookies.get('stock-mode')
    
    if (stockMode?.value === 'false') {
      return NextResponse.json(
        { error: 'Stock mode is disabled. Please enable stock mode in the header to use this feature.' },
        { status: 400 }
      )
    }
    
    // Get query parameters
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol')
    const interval = url.searchParams.get('interval') || '1mo'

    // Validate input
    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      )
    }

    // Get Polygon.io API key from environment variables
    const apiKey = process.env.POLYGON_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Polygon API key is not configured' },
        { status: 500 }
      )
    }

    // Map interval to Polygon.io parameters
    const { timespan, multiplier, from, to } = mapIntervalToPolygon(interval)

    try {
      // Fetch stock details
      const detailsResponse = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${apiKey}`
      )
      
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch stock details: ${detailsResponse.statusText}`)
      }
      
      const detailsData = await detailsResponse.json()
      
      // Fetch stock aggregates (historical data)
      const aggregatesResponse = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`
      )
      
      if (!aggregatesResponse.ok) {
        throw new Error(`Failed to fetch stock aggregates: ${aggregatesResponse.statusText}`)
      }
      
      const aggregatesData = await aggregatesResponse.json()
      
      // Fetch previous close
      const prevCloseResponse = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`
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
      const response = {
        symbol: symbol,
        name: detailsData.results?.name || symbol,
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
      
      return NextResponse.json(response)
    } catch (error: unknown) {
      console.error('Error fetching from Polygon.io:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json(
        { error: 'Failed to fetch stock data', details: errorMessage },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('API route error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Error processing your request', details: errorMessage },
      { status: 500 }
    )
  }
} 