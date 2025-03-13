import { relatedSchema } from '@/lib/schema/related'
import { getModel, getToolCallModel, isProviderEnabled, isToolCallSupported } from '@/lib/utils/registry'
import { generateObject, LanguageModelV1 } from 'ai'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Function to clean up malformed JSON
function cleanupJSON(jsonString: string): string {
  // Remove trailing commas
  return jsonString.replace(/,(\s*[}\]])/g, '$1')
}

// Function to attempt to fix and parse the response
function parseResponse(result: any): Array<{ query: string }> {
  if (result?.object?.items) {
    return result.object.items
  }

  // If we have a failed_generation field, try to parse it
  if (result?.error?.failed_generation) {
    try {
      const cleanedJSON = cleanupJSON(result.error.failed_generation)
      const parsed = JSON.parse(cleanedJSON)
      if (parsed?.items && Array.isArray(parsed.items)) {
        return parsed.items
      }
    } catch (e) {
      console.error('Failed to parse failed_generation:', e)
    }
  }

  throw new Error('Could not parse response into valid format')
}

async function generateQuestionsWithRetry(model: LanguageModelV1, content: string, maxRetries = 3): Promise<Array<{ query: string }>> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await generateObject({
        model,
        system: `You are an AI assistant tasked with generating exactly 3 follow-up questions based on the given content. Your response must strictly follow this format, with NO trailing commas:

{
  "items": [
    { "query": "First question here?" },
    { "query": "Second question here?" },
    { "query": "Third question here?" }
  ]
}

Requirements:
1. Generate EXACTLY 3 questions
2. Each question must end with a question mark
3. Questions must be complete sentences
4. No trailing commas in the JSON
5. Questions should be relevant to the content
6. Each question should explore a different aspect
7. Keep questions clear and concise

Important: Ensure the JSON is properly formatted with no trailing commas.`,
        messages: [{ 
          role: 'user', 
          content: `Generate exactly 3 follow-up questions about: ${content}`
        }],
        schema: relatedSchema,
        temperature: 0.5 // Lower temperature for more consistent formatting
      })

      const items = parseResponse(result)
      
      if (items.length === 3 && items.every(item => typeof item.query === 'string' && item.query.trim().endsWith('?'))) {
        return items
      }
      
      throw new Error('Generated questions did not meet requirements')
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Wait a bit before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
      }
    }
  }

  throw lastError || new Error('Failed to generate valid questions after all retries')
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get the currently selected model from cookies
    const cookieStore = await cookies()
    const modelJson = cookieStore.get('selectedModel')?.value
    let selectedModel = {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'Google Generative AI',
      providerId: 'google',
      enabled: true,
      toolCallType: 'manual'
    }

    if (modelJson) {
      try {
        selectedModel = JSON.parse(modelJson)
      } catch (e) {
        console.error('Failed to parse selected model:', e)
      }
    }

    // Check if the provider is enabled
    if (!isProviderEnabled(selectedModel.providerId) || selectedModel.enabled === false) {
      return NextResponse.json(
        { error: `Selected provider ${selectedModel.providerId} is not enabled` },
        { status: 404 }
      )
    }

    // Format the model ID with provider
    const modelId = `${selectedModel.providerId}:${selectedModel.id}`
    
    // Use the appropriate model for generating related questions
    const supportedModel = isToolCallSupported(modelId)
    const currentModel = supportedModel
      ? getModel(modelId)
      : getToolCallModel(modelId)

    const items = await generateQuestionsWithRetry(currentModel, content)
    return NextResponse.json({ questions: items.map(item => item.query) })
  } catch (error) {
    console.error('Error generating related questions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to generate related questions: ${errorMessage}` },
      { status: 500 }
    )
  }
} 