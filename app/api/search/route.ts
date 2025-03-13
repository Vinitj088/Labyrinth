import { search } from '@/lib/tools/search'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query, max_results, search_depth, include_domains, exclude_domains } =
      await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await search(
      query,
      max_results,
      search_depth,
      include_domains,
      exclude_domains
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
} 