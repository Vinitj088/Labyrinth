import { retrieveSchema } from '@/lib/schema/retrieve'
import { SearchResults as SearchResultsType } from '@/lib/types'
import { tool } from 'ai'

const CONTENT_CHARACTER_LIMIT = 10000

async function fetchJinaReaderData(
  url: string
): Promise<SearchResultsType | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-With-Generated-Alt': 'true'
      }
    })
    const json = await response.json()
    if (!json.data || json.data.length === 0) {
      return null
    }

    const content = json.data.content.slice(0, CONTENT_CHARACTER_LIMIT)

    return {
      results: [
        {
          title: json.data.title,
          content,
          url: json.data.url
        }
      ],
      query: '',
      images: []
    }
  } catch (error) {
    console.error('Jina Reader API error:', error)
    return null
  }
}

async function fetchTavilyExtractData(
  url: string
): Promise<SearchResultsType | null> {
  try {
    const apiKey = process.env.TAVILY_API_KEY
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ urls: [url] })
    })
    const json = await response.json()
    if (!json.results || json.results.length === 0) {
      return null
    }

    const result = json.results[0]
    const content = result.raw_content.slice(0, CONTENT_CHARACTER_LIMIT)

    return {
      results: [
        {
          title: content.slice(0, 100),
          content,
          url: result.url
        }
      ],
      query: '',
      images: []
    }
  } catch (error) {
    console.error('Tavily Extract API error:', error)
    return null
  }
}

async function fetchLinkUpData(
  url: string
): Promise<SearchResultsType | null> {
  try {
    const apiKey = process.env.LINKUP_API_KEY
    if (!apiKey) {
      throw new Error('LINKUP_API_KEY is not set in the environment variables')
    }
    
    console.log('Using LinkUp to retrieve content from URL:', url);
    
    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      // Ensure the URL uses http or https protocol
      if (!validUrl.protocol.match(/^https?:$/)) {
        throw new Error('Invalid protocol');
      }
    } catch (urlError) {
      console.error('Invalid URL format:', urlError);
      return {
        results: [{
          title: 'Invalid URL',
          content: `The URL "${url}" is not valid. Please provide a valid http or https URL.`,
          url: '#'
        }],
        query: '',
        images: []
      };
    }
    
    // Define request body with proper typing
    const requestBody = {
      q: `Information about ${validUrl.toString()}`,
      depth: 'deep',
      outputType: "sourcedAnswer",
      includeImages: false,
      includeDomains: [validUrl.hostname]
    };
    
    console.log('LinkUp retrieve request body:', JSON.stringify(requestBody));
    
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
      return {
        results: [{
          title: 'Error Retrieving Content',
          content: `Failed to retrieve content from ${validUrl.toString()}: ${response.status} ${response.statusText}`,
          url: validUrl.toString()
        }],
        query: '',
        images: []
      };
    }
    
    const data = await response.json();
    
    if (!data.answer && (!data.sources || data.sources.length === 0)) {
      console.log('No content found from LinkUp for URL:', validUrl.toString());
      return {
        results: [{
          title: 'No Content Found',
          content: `No content could be retrieved from ${validUrl.toString()}`,
          url: validUrl.toString()
        }],
        query: '',
        images: []
      };
    }
    
    // Combine answer and sources for the best content extraction
    let content = data.answer || '';
    let title = `Content from ${validUrl.toString()}`;
    
    if (data.sources && data.sources.length > 0) {
      // Find the most relevant source from the URL
      const relevantSource = data.sources.find((source: any) => 
        source.url && new URL(source.url).hostname === validUrl.hostname
      );
      
      const bestSource = relevantSource || data.sources[0];
      
      if (bestSource) {
        if (bestSource.title) {
          title = bestSource.title;
        }
        
        if (bestSource.content || bestSource.snippet) {
          if (content) {
            content += '\n\n' + (bestSource.content || bestSource.snippet);
          } else {
            content = bestSource.content || bestSource.snippet;
          }
        }
      }
    }
    
    content = content.slice(0, CONTENT_CHARACTER_LIMIT);
    
    return {
      results: [
        {
          title: title,
          content: content || `No detailed content available for ${validUrl.toString()}`,
          url: validUrl.toString()
        }
      ],
      query: '',
      images: []
    };
  } catch (error: unknown) {
    console.error('LinkUp API error for URL retrieval:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      results: [
        {
          title: 'Error',
          content: `Failed to retrieve content: ${errorMessage}`,
          url: '#'
        }
      ],
      query: '',
      images: []
    };
  }
}

export const retrieveTool = tool({
  description: 'Retrieve content from the web',
  parameters: retrieveSchema,
  execute: async ({ url }) => {
    let results: SearchResultsType | null
    
    // Determine which API to use for retrieval
    const searchAPI = process.env.SEARCH_API
    
    if (searchAPI === 'linkup' && process.env.LINKUP_API_KEY) {
      // Use LinkUp if it's the configured search API
      results = await fetchLinkUpData(url)
    } else if (process.env.JINA_API_KEY) {
      // Use Jina if the API key is set
      results = await fetchJinaReaderData(url)
    } else if (process.env.TAVILY_API_KEY) {
      // Use Tavily as a fallback
      results = await fetchTavilyExtractData(url)
    } else {
      console.error('No API keys configured for content retrieval')
      return null
    }

    if (!results) {
      return null
    }

    return results
  }
})
