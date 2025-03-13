import { searchSchema } from '@/lib/schema/search'
import {
  SearchResultImage,
  SearchResultItem,
  SearchResults,
  SearXNGResponse,
  SearXNGResult
} from '@/lib/types'
import { sanitizeUrl } from '@/lib/utils'
import { tool } from 'ai'
import Exa from 'exa-js'

// Update the search depth options
export type SearchDepth = 'standard' | 'deep';

// If there's a default depth being set as 'basic', change it to 'standard'
const DEFAULT_DEPTH: SearchDepth = 'standard';

export const searchTool = tool({
  description: 'Search the web for information',
  parameters: searchSchema,
  execute: async ({
    query,
    max_results,
    search_depth,
    include_domains,
    exclude_domains
  }) => {
    // Ensure query has minimum characters
    const filledQuery =
      query.length < 5 ? query + ' '.repeat(5 - query.length) : query
    let searchResult: SearchResults
    
    // Get the configured search API and validate API keys
    const searchAPI =
      (process.env.SEARCH_API as 'tavily' | 'exa' | 'searxng' | 'linkup') || 'tavily'
    
    // Check for required API keys
    const hasLinkupKey = Boolean(process.env.LINKUP_API_KEY)
    const hasTavilyKey = Boolean(process.env.TAVILY_API_KEY)
    const hasExaKey = Boolean(process.env.EXA_API_KEY)
    const hasSearxngUrl = Boolean(process.env.SEARXNG_API_URL)
    
    // Determine which search API to use based on availability
    let selectedAPI = searchAPI
    if (searchAPI === 'linkup' && !hasLinkupKey) {
      console.log('LinkUp API key not found, falling back to alternative search')
      if (hasTavilyKey) selectedAPI = 'tavily'
      else if (hasExaKey) selectedAPI = 'exa'
      else if (hasSearxngUrl) selectedAPI = 'searxng'
      else throw new Error('No search API keys configured')
    }

    // Determine search depth based on configuration
    const effectiveSearchDepth =
      selectedAPI === 'searxng' &&
      process.env.SEARXNG_DEFAULT_DEPTH === 'advanced'
        ? 'advanced'
        : search_depth || 'basic'

    console.log(
      `Using search API: ${selectedAPI}, Search Depth: ${effectiveSearchDepth}`
    )

    try {
      // Use advanced search API for SearXNG
      if (selectedAPI === 'searxng' && effectiveSearchDepth === 'advanced') {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/advanced-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: filledQuery,
            maxResults: max_results,
            searchDepth: effectiveSearchDepth,
            includeDomains: include_domains,
            excludeDomains: exclude_domains
          })
        })
        if (!response.ok) {
          throw new Error(
            `Advanced search API error: ${response.status} ${response.statusText}`
          )
        }
        searchResult = await response.json()
      } else {
        // Determine which search function to use based on configured API
        let searchFunction;
        switch(selectedAPI) {
          case 'tavily':
            searchFunction = tavilySearch;
            break;
          case 'exa':
            searchFunction = exaSearch;
            break;
          case 'linkup':
            searchFunction = linkupSearch;
            break;
          case 'searxng':
          default:
            searchFunction = searxngSearch;
            break;
        }
        
        // Execute the selected search function
        searchResult = await searchFunction(
          filledQuery,
          max_results,
          effectiveSearchDepth === 'advanced' ? 'advanced' : 'basic',
          include_domains,
          exclude_domains
        );
      }
    } catch (error) {
      console.error('Search API error:', error)
      // Return structured error result instead of throwing
      searchResult = {
        results: [{
          title: "Search Error",
          url: "#",
          content: `An error occurred while searching: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        query: filledQuery,
        images: [],
        number_of_results: 1
      }
    }

    console.log('completed search')
    return searchResult
  }
})

export async function search(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  return searchTool.execute(
    {
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    },
    {
      toolCallId: 'search',
      messages: []
    }
  )
}

async function tavilySearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set in the environment variables')
  }
  const includeImageDescriptions = true
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query,
      max_results: Math.max(maxResults, 5),
      search_depth: searchDepth,
      include_images: true,
      include_image_descriptions: includeImageDescriptions,
      include_answers: true,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    })
  })

  if (!response.ok) {
    throw new Error(
      `Tavily API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const processedImages = includeImageDescriptions
    ? data.images
        .map(({ url, description }: { url: string; description: string }) => ({
          url: sanitizeUrl(url),
          description
        }))
        .filter(
          (
            image: SearchResultImage
          ): image is { url: string; description: string } =>
            typeof image === 'object' &&
            image.description !== undefined &&
            image.description !== ''
        )
    : data.images.map((url: string) => sanitizeUrl(url))

  return {
    ...data,
    images: processedImages
  }
}

async function exaSearch(
  query: string,
  maxResults: number = 10,
  _searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    throw new Error('EXA_API_KEY is not set in the environment variables')
  }

  const exa = new Exa(apiKey)
  const exaResults = await exa.searchAndContents(query, {
    highlights: true,
    numResults: maxResults,
    includeDomains,
    excludeDomains
  })

  return {
    results: exaResults.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.highlight || result.text
    })),
    query,
    images: [],
    number_of_results: exaResults.results.length
  }
}

async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) {
    throw new Error('SEARXNG_API_URL is not set in the environment variables')
  }

  try {
    // Construct the URL with query parameters
    const url = new URL(`${apiUrl}/search`)
    url.searchParams.append('q', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('categories', 'general,images')

    // Apply search depth settings
    if (searchDepth === 'advanced') {
      url.searchParams.append('time_range', '')
      url.searchParams.append('safesearch', '0')
      url.searchParams.append('engines', 'google,bing,duckduckgo,wikipedia')
    } else {
      url.searchParams.append('time_range', 'year')
      url.searchParams.append('safesearch', '1')
      url.searchParams.append('engines', 'google,bing')
    }

    // Fetch results from SearXNG
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SearXNG API error (${response.status}):`, errorText)
      throw new Error(
        `SearXNG API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data: SearXNGResponse = await response.json()

    // Separate general results and image results, and limit to maxResults
    const generalResults = data.results
      .filter(result => !result.img_src)
      .slice(0, maxResults)
    const imageResults = data.results
      .filter(result => result.img_src)
      .slice(0, maxResults)

    // Format the results to match the expected SearchResults structure
    return {
      results: generalResults.map(
        (result: SearXNGResult): SearchResultItem => ({
          title: result.title,
          url: result.url,
          content: result.content
        })
      ),
      query: data.query,
      images: imageResults
        .map(result => {
          const imgSrc = result.img_src || ''
          return imgSrc.startsWith('http') ? imgSrc : `${apiUrl}${imgSrc}`
        })
        .filter(Boolean),
      number_of_results: data.number_of_results
    }
  } catch (error) {
    console.error('SearXNG API error:', error)
    throw error
  }
}

async function linkupSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.LINKUP_API_KEY
  if (!apiKey) {
    throw new Error('LINKUP_API_KEY is not set in the environment variables')
  }

  interface LinkUpRequestBody {
    q: string;
    depth: 'standard' | 'deep';
    outputType: string;
    includeImages: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
  }

  interface LinkUpSource {
    title?: string;
    url?: string;
    snippet?: string;
    content?: string;
  }

  interface LinkUpResponse {
    answer?: string;
    sources?: LinkUpSource[];
    error?: string;
  }
  
  try {
    // Convert search depth to LinkUp format
    const depth = searchDepth === 'advanced' ? 'deep' : 'standard';
    
    // Construct request body with proper typing
    const requestBody: LinkUpRequestBody = {
      q: query,
      depth,
      outputType: "sourcedAnswer",
      includeImages: false,
      ...(includeDomains.length > 0 && { includeDomains }),
      ...(excludeDomains.length > 0 && { excludeDomains })
    };
    
    console.log('LinkUp request:', {
      query,
      depth,
      maxResults,
      includeDomains,
      excludeDomains
    });
    
    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LinkUp API error (${response.status}):`, errorText);
      throw new Error(`LinkUp API error: ${response.status} ${response.statusText}`);
    }

    const data: LinkUpResponse = await response.json();
    
    if (data.error) {
      throw new Error(`LinkUp API returned error: ${data.error}`);
    }
    
    // Transform the LinkUp response to match SearchResults format
    const results: SearchResultItem[] = [];
    
    // Add the main answer if it exists
    
    
    // Add sources as additional results
    if (Array.isArray(data.sources)) {
      const remainingSlots = maxResults - results.length;
      const validSources = data.sources
        .filter((source): source is Required<LinkUpSource> => 
          Boolean(source?.url && (source?.snippet || source?.content)))
        .slice(0, remainingSlots)
        .map(source => {
          let sourceTitle = source.title;
          let sourceUrl = source.url;
          
          // Validate and sanitize URL
          try {
            const url = new URL(source.url);
            sourceUrl = url.toString();
            if (!sourceTitle) {
              sourceTitle = url.hostname;
            }
          } catch (e) {
            console.warn(`Invalid URL in source: ${source.url}`);
            sourceUrl = "#";
            sourceTitle = sourceTitle || "Unknown Source";
          }
          
          return {
            title: sourceTitle,
            url: sourceUrl,
            content: source.snippet || source.content
          };
        });
      
      results.push(...validSources);
    }
    
    // Provide fallback if no results found
    if (results.length === 0) {
      results.push({
        title: "No Results Found",
        url: "#",
        content: "No relevant information was found for your query. Please try different search terms."
      });
    }
    
    return {
      results,
      query,
      images: [], // LinkUp doesn't currently support image results
      number_of_results: results.length
    };
    
  } catch (error) {
    console.error('LinkUp search error:', error);
    throw error; // Let the main search tool handle the error
  }
}
