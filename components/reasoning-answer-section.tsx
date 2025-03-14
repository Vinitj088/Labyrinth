'use client'

import { Badge } from '@/components/ui/badge'
import { CHAT_ID } from '@/lib/constants'
import { useChat } from 'ai/react'
import { Check, Clock, Loader2 } from 'lucide-react'
import { CollapsibleMessage } from './collapsible-message'
import { DefaultSkeleton } from './default-skeleton'
import { BotMessage } from './message'
import { MessageActions } from './message-actions'
import { StatusIndicator } from './ui/status-indicator'

interface ReasoningAnswerContent {
  reasoning: string
  answer?: string
  time?: number
}

export interface ReasoningAnswerSectionProps {
  content: ReasoningAnswerContent
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  chatId?: string
}

export function ReasoningAnswerSection({
  content,
  isOpen,
  onOpenChange,
  chatId
}: ReasoningAnswerSectionProps) {
  const enableShare = process.env.NEXT_PUBLIC_ENABLE_SHARE === 'true'
  const { isLoading } = useChat({ id: CHAT_ID })

  // Format time to display in seconds with one decimal place
  const formattedTime = content.time !== undefined && content.time > 0
    ? `${(content.time / 1000).toFixed(1)}s`
    : null

  // Determine if we're in the thinking state
  const isThinking = isLoading || !content.answer || content.answer.length === 0;
  
  // Determine if reasoning is complete
  const isReasoningComplete = !isThinking && content.reasoning && content.reasoning.length > 0;

  const reasoningHeader = (
    <div className="flex items-center gap-2 w-full">
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between">
          {isThinking ? (
            <Badge className="flex items-center gap-1.5" variant="secondary">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </Badge>
          ) : isReasoningComplete ? (
            <div className="flex items-center gap-2">
              <div className="bg-background border border-border rounded-md py-1 px-3 flex items-center gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="font-medium text-foreground">Reasoned</span>
                </div>
                {formattedTime && (
                  <div className="flex items-center gap-1 text-muted-foreground ml-1">
                    <Clock size={10} className="opacity-70" />
                    <span className="text-[11px]">{formattedTime}</span>
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <StatusIndicator icon={Check} iconClassName="text-green-500">
                  {`${content.reasoning.length.toLocaleString()} characters`}
                </StatusIndicator>
              </div>
            </div>
          ) : (
            <Badge className="flex items-center gap-1.5" variant="secondary">
              Processing...
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  if (!content) return <DefaultSkeleton />

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={reasoningHeader}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showBorder={true}
        className="bg-muted/50"
      >
        <BotMessage
          message={content.reasoning}
          messageId={`reasoning-${chatId || 'default'}`}
          className="px-2 prose-p:text-foreground/60"
        />
      </CollapsibleMessage>

      <CollapsibleMessage
        role="assistant"
        isCollapsible={false}
        showIcon={false}
      >
        {content.answer && (
          <div className="flex flex-col gap-4">
            <BotMessage 
              message={content.answer || ''} 
              messageId={`answer-${chatId || 'default'}`}
            />
            <MessageActions
              message={content.answer || ''}
              chatId={chatId}
              enableShare={enableShare}
            />
          </div>
        )}
      </CollapsibleMessage>
    </div>
  )
}
