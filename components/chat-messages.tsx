'use client'

import { JSONValue, Message } from 'ai'
import { memo, useEffect, useRef, useState } from 'react'
import { RenderMessage } from './render-message'
import { Spinner } from './ui/spinner'

interface ChatMessagesProps {
  messages: Message[]
  data: JSONValue[] | undefined
  onQuerySelect: (query: string) => void
  isLoading: boolean
  chatId?: string
}

// Memoize individual messages to prevent unnecessary re-renders
const MemoizedRenderMessage = memo(RenderMessage)

export function ChatMessages({
  messages,
  data,
  onQuerySelect,
  isLoading,
  chatId
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
  const manualToolCallId = 'manual-tool-call'

  // Scroll to bottom smoothly as new content arrives
  useEffect(() => {
    const smoothScroll = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    const timeoutId = setTimeout(smoothScroll, 100)
    return () => clearTimeout(timeoutId)
  }, [messages])

  // Update open states when new messages arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage) {
      // Keep related questions open for the last message
      const relatedId = `${lastMessage.id}-related`
      setOpenStates(prev => ({
        ...prev,
        [manualToolCallId]: lastMessage.role === 'user',
        [relatedId]: true
      }))
    }
  }, [messages])

  const lastUserIndex = messages.length - 1 - 
    [...messages].reverse().findIndex(msg => msg.role === 'user')

  const getIsOpen = (id: string) => {
    const baseId = id.endsWith('-related') ? id.slice(0, -8) : id
    const index = messages.findIndex(msg => msg.id === baseId)
    const isLastMessage = index === messages.length - 1
    
    // Always keep related questions open for the last message
    if (id.endsWith('-related') && isLastMessage) {
      return true
    }
    
    return openStates[id] ?? index >= lastUserIndex
  }

  const handleOpenChange = (id: string, open: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: open
    }))
  }

  if (!messages.length) return null

  return (
    <div className="relative mx-auto px-4 w-full">
      {messages.map(message => (
        <div key={message.id} className="mb-4 flex flex-col gap-4">
          <MemoizedRenderMessage
            message={message}
            messageId={message.id}
            getIsOpen={getIsOpen}
            onOpenChange={handleOpenChange}
            onQuerySelect={onQuerySelect}
            chatId={chatId}
          />
        </div>
      ))}
      {isLoading && <Spinner />}
      <div ref={messagesEndRef} />
    </div>
  )
}
