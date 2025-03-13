'use client'

import { useAuthCheck } from '@/lib/hooks/use-auth-check'
import { Model } from '@/lib/types/models'
import { Message, useChat } from 'ai/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { AuthDialog } from './auth-dialog'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const router = useRouter()
  const initialMessagesSent = useRef(false)
  const queryMessageSent = useRef(false)
  const { checkAuth, showAuthDialog, setShowAuthDialog } = useAuthCheck()

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
    append,
    data,
    setData
  } = useChat({
    initialMessages: [],
    id,
    body: {
      id
    },
    onFinish: async (message) => {
      // Remove the redirect
      // router.push(`/search/${id}`, { scroll: false })
      
      // Generate related questions after each AI response
      try {
        const relatedQuestions = await generateRelatedQuestions(message.content)
        const updatedMessage = {
          ...message,
          annotations: [
            ...(message.annotations || []),
            {
              type: 'related-questions',
              data: {
                items: relatedQuestions.map((question: string) => ({ query: question }))
              }
            }
          ]
        }
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? updatedMessage : msg
        ))
      } catch (error) {
        console.error('Failed to generate related questions:', error)
      }
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false
  })

  // Function to generate related questions based on the AI response
  const generateRelatedQuestions = async (content: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/related-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate related questions')
      }
      
      const data = await response.json()
      return data.questions || []
    } catch (error) {
      console.error('Error generating related questions:', error)
      return []
    }
  }

  useEffect(() => {
    if (savedMessages && savedMessages.length > 0 && !initialMessagesSent.current) {
      initialMessagesSent.current = true
      setMessages(savedMessages)
    }
  }, [savedMessages, setMessages])

  useEffect(() => {
    if (query && !queryMessageSent.current && messages.length === 0) {
      queryMessageSent.current = true
      append({
        role: 'user',
        content: query
      })
    }
  }, [query, append, messages.length])

  const onQuerySelect = (query: string) => {
    if (!checkAuth()) return
    append({
      role: 'user',
      content: query
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!checkAuth()) return
    setData(undefined) // reset data to clear tool call
    handleSubmit(e)
  }

  return (
    <>
      <div className="flex flex-col w-full max-w-3xl pt-14 pb-60 mx-auto stretch">
        <ChatMessages
          messages={messages}
          data={data}
          onQuerySelect={onQuerySelect}
          isLoading={isLoading}
          chatId={id}
        />
        <ChatPanel
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
          messages={messages}
          setMessages={setMessages}
          stop={stop}
          query={query}
          append={append}
          models={models}
        />
      </div>
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => {
          setShowAuthDialog(false)
          // Retry the last action after successful authentication
          if (input.trim()) {
            handleSubmit(new Event('submit') as any)
          }
        }}
      />
    </>
  )
}
