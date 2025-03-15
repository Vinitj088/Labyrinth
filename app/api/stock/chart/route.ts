import { getStockData } from '@/lib/tools/stock'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30 // Set max duration to 30 seconds

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check if stock mode is explicitly enabled from the cookie in the request
    const stockMode = req.cookies.get('stock-mode')
    
    // Default to disabled - only allow if explicitly set to true
    if (!stockMode || stockMode.value !== 'true') {
      return NextResponse.json(
        { 
          error: 'Stock mode is disabled. Please enable stock mode in the header to use this feature.',
          stockModeValue: stockMode?.value || 'not set'
        },
        { status: 400 }
      )
    }
    
    // Get query parameters
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol')
    const interval = url.searchParams.get('interval') || '1mo'
    const compareSymbolsStr = url.searchParams.get('compare_symbols')
    const compareSymbols = compareSymbolsStr ? compareSymbolsStr.split(',') : []

    // Validate input
    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      )
    }

    // Call the stock data tool directly
    try {
      const result = await getStockData.execute({
        symbol,
        interval: interval as any,
        compare_symbols: compareSymbols
      }, {
        toolCallId: 'direct-api-call',
        messages: []
      })

      // If there's no UI data, it means there was an error
      if (!result.ui) {
        return NextResponse.json(
          { error: result.content },
          { status: 404 }
        )
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error calling stock data tool:', error)
      return NextResponse.json(
        { error: 'Failed to get stock data', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Error processing your request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 