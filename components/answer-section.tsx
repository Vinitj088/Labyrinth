'use client'

import { useChat } from 'ai/react'
import { Text } from 'lucide-react'
import { CollapsibleMessage } from './collapsible-message'
import { DefaultSkeleton } from './default-skeleton'
import { BotMessage } from './message'
import { MessageActions } from './message-actions'

interface AnswerSectionProps {
  content?: string
  isLoading?: boolean
  chatId: string
  enableShare?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isNewMessage?: boolean
}

export function AnswerSection({
  content,
  isLoading = false,
  chatId,
  enableShare = true
}: AnswerSectionProps) {
  const { messages } = useChat()

  if (isLoading) {
    return <DefaultSkeleton />
  }

  if (!content) {
    return null
  }

  const messageId = `answer-${chatId}`

  const header = (
    <div className="flex items-center gap-1">
      <Text size={16} />
      <div>Answer</div>
    </div>
  )
  const message = content ? (
    <div className="flex flex-col gap-1">
      <BotMessage 
        message={content} 
        messageId={messageId}
        isNewMessage={false} 
      />
      <MessageActions
        message={content}
        chatId={chatId}
        enableShare={enableShare}
      />
    </div>
  ) : null

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={false}
      header={header}
      isOpen={true}
      onOpenChange={(open) => {
        // Handle open change if needed
      }}
      showBorder={false}
    >
      {message}
    </CollapsibleMessage>
  )
}
