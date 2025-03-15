import { extractStockSymbols, getMostLikelyStockSymbol } from '@/lib/utils/stock-symbol-extractor'
import { JSONValue, Message, ToolInvocation } from 'ai'
import { useMemo } from 'react'
import { AnswerSection } from './answer-section'
import { DirectStockChart } from './direct-stock-chart'
import { ReasoningAnswerSection } from './reasoning-answer-section'
import RelatedQuestions from './related-questions'
import { StockChart } from './stock-chart'
import { ToolSection } from './tool-section'
import { UserMessage } from './user-message'

// Stock detection regex patterns
const STOCK_CHART_REGEX = /(?:stock|price|chart|ticker|quote|shares|market|trading|invest|performance|trend|graph|historical|data|analysis|financial|equity|securities|exchange|nyse|nasdaq|dow|sp500|s&p|etf|fund|portfolio|asset|security|dividend|earnings|volatility|volume|candlestick|technical|fundamental|bull|bear|rally|correction|crash|boom|growth|decline|gain|loss|return|yield|cap|valuation|pe ratio|eps|revenue|profit|income|balance sheet|cash flow|statement|quarter|annual|fiscal|report|forecast|prediction|outlook|target|recommendation|buy|sell|hold|rating|upgrade|downgrade|overweight|underweight|neutral|outperform|underperform|sector|industry|company|corporation|inc|ltd|plc)\s+(?:of|for|on|about)?\s*([A-Z]{1,5})(?:[,\s]|$)|(?:^|\s)([A-Z]{1,5})(?:\s+(?:stock|price|chart|ticker|quote|shares|market|trading|performance|trend|graph|data|analysis))|(?:^|\s)([A-Z]{1,5})(?:[,\s]|$)/i;

const STOCK_COMPARE_REGEX = /(?:compare|vs|versus|against|with|and|to|between)\s+([A-Z]{1,5})(?:\s+(?:and|with|to|versus|vs)\s+([A-Z]{1,5}))?/i;

interface RenderMessageProps {
  message: Message
  messageId: string
  getIsOpen: (id: string) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  chatId?: string
  isStockMode?: boolean
  data?: JSONValue[] | undefined
}

// Function to check if a user message is stock-related
const isStockQuery = (content: string): boolean => {
  // Use our extractor to check if this is a stock-related query
  const symbols = extractStockSymbols(content);
  return symbols !== null && symbols.length > 0;
};

// Function to extract stock symbol from user message content
const extractStockSymbol = (content: string): string | undefined => {
  // Use our extractor to get the most likely stock symbol
  const symbol = getMostLikelyStockSymbol(content);
  return symbol || undefined;
};

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  chatId,
  isStockMode = false,
  data
}: RenderMessageProps) {
  const relatedQuestions = useMemo(
    () =>
      message.annotations?.filter(
        annotation => (annotation as any)?.type === 'related-questions'
      ),
    [message.annotations]
  )

  // Render for manual tool call
  const toolData = useMemo(() => {
    const toolAnnotations =
      (message.annotations?.filter(
        annotation =>
          (annotation as unknown as { type: string }).type === 'tool_call'
      ) as unknown as Array<{
        data: {
          args: string
          toolCallId: string
          toolName: string
          result?: string
          state: 'call' | 'result'
        }
      }>) || []

    const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
      const existing = acc.get(annotation.data.toolCallId)
      if (!existing || annotation.data.state === 'result') {
        acc.set(annotation.data.toolCallId, {
          ...annotation.data,
          args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
          result:
            annotation.data.result && annotation.data.result !== 'undefined'
              ? JSON.parse(annotation.data.result)
              : undefined
        } as ToolInvocation)
      }
      return acc
    }, new Map<string, ToolInvocation>())

    return Array.from(toolDataMap.values())
  }, [message.annotations])

  // Extract stock data from message content (only if stock mode is enabled)
  const stockChartData = useMemo(() => {
    // Skip all processing if stock mode is disabled
    if (!isStockMode) return null;
    
    if (message.role !== 'assistant') return null;
    
    const content = message.content;
    if (!content) return null;
    
    // Try to extract JSON from the content
    const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1].trim());
        if (data.chart && data.stock_symbols) {
          return data;
        }
      } catch (err) {
        console.error('Error parsing JSON from content:', err);
      }
    }
    
    return null;
  }, [message.content, message.role, isStockMode]);
  
  // Extract stock symbol from user's message only (only if stock mode is enabled)
  const userStockSymbol = useMemo(() => {
    // Skip all processing if stock mode is disabled
    if (!isStockMode) return undefined;
    
    if (message.role === 'user' && isStockQuery(message.content)) {
      return extractStockSymbol(message.content);
    }
    return undefined;
  }, [message.role, message.content, isStockMode]);

  // Determine if we should show a stock chart for this message
  const shouldShowStockChart = useMemo(() => {
    // Never show stock charts if stock mode is disabled
    if (!isStockMode) return false;
    
    // For user messages, only show if it's a stock query
    if (message.role === 'user') {
      return userStockSymbol !== undefined;
    }
    
    // For assistant messages, only show if we have explicit stock data from JSON
    if (message.role === 'assistant') {
      return stockChartData !== null;
    }
    
    return false;
  }, [message.role, userStockSymbol, stockChartData, isStockMode]);

  // Extract the unified reasoning annotation directly.
  const reasoningAnnotation = useMemo(() => {
    const annotations = message.annotations as any[] | undefined
    if (!annotations) return null
    return (
      annotations.find(a => a.type === 'reasoning' && a.data !== undefined) ||
      null
    )
  }, [message.annotations])

  // Extract the reasoning time and reasoning content from the annotation.
  // If annotation.data is an object, use its fields. Otherwise, default to a time of 0.
  const reasoningTime = useMemo(() => {
    if (!reasoningAnnotation) return 0
    if (
      typeof reasoningAnnotation.data === 'object' &&
      reasoningAnnotation.data !== null
    ) {
      return reasoningAnnotation.data.time ?? 0
    }
    return 0
  }, [reasoningAnnotation])

  const reasoningResult = useMemo(() => {
    if (!reasoningAnnotation) return message.reasoning
    if (
      typeof reasoningAnnotation.data === 'object' &&
      reasoningAnnotation.data !== null
    ) {
      return reasoningAnnotation.data.reasoning ?? message.reasoning
    }
    return message.reasoning
  }, [reasoningAnnotation, message.reasoning])

  // Add a check for new messages
  const isNewMessage = message.createdAt ? 
    Date.now() - new Date(message.createdAt).getTime() < 1000 : false

  if (message.role === 'user') {
    // For user messages with stock queries, render the user message with stock chart
    if (shouldShowStockChart) {
      return (
        <div className="group relative mb-4">
          <UserMessage message={message.content} />
          <div className="mt-2">
            <DirectStockChart initialSymbol={userStockSymbol} query={message.content} />
          </div>
        </div>
      );
    }
    return <UserMessage message={message.content} />
  }

  if (message.toolInvocations?.length) {
    return (
      <>
        {message.toolInvocations.map(tool => (
          <ToolSection
            key={tool.toolCallId}
            tool={tool}
            isOpen={getIsOpen(messageId)}
            onOpenChange={open => onOpenChange(messageId, open)}
          />
        ))}
      </>
    )
  }

  return (
    <>
      {toolData.map(tool => (
        <ToolSection
          key={tool.toolCallId}
          tool={tool}
          isOpen={getIsOpen(tool.toolCallId)}
          onOpenChange={open => onOpenChange(tool.toolCallId, open)}
        />
      ))}
      {reasoningResult ? (
        <ReasoningAnswerSection
          content={{
            reasoning: reasoningResult,
            answer: message.content,
            time: reasoningTime
          }}
          isOpen={getIsOpen(messageId)}
          onOpenChange={open => onOpenChange(messageId, open)}
          chatId={chatId}
        />
      ) : (
        <AnswerSection
          content={message.content}
          isOpen={getIsOpen(messageId)}
          onOpenChange={(open: boolean) => onOpenChange(messageId, open)}
          chatId={chatId!}
          isNewMessage={isNewMessage}
        />
      )}
      
      {/* Render stock chart if available from explicit JSON data */}
      {shouldShowStockChart && stockChartData && (
        <div className="mt-4 border border-border rounded-lg p-4">
          <div className="mb-2 text-sm text-muted-foreground">
            Stock data found: {stockChartData.stock_symbols.join(', ')}
          </div>
          <StockChart data={stockChartData} />
        </div>
      )}
      
      {!message.toolInvocations &&
        relatedQuestions &&
        relatedQuestions.length > 0 && (
          <RelatedQuestions
            annotations={relatedQuestions as JSONValue[]}
            onQuerySelect={onQuerySelect}
            isOpen={getIsOpen(`${messageId}-related`)}
            onOpenChange={open => onOpenChange(`${messageId}-related`, open)}
          />
        )}
    </>
  )
}
