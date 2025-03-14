'use client'

import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Components } from 'react-markdown'
import { CodeComponent } from 'react-markdown/lib/ast-to-react'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Citing } from './custom-link'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './ui/markdown'

const CHUNK_SIZE = 10 // Number of characters to render per frame
const FRAME_RATE = 1000 / 60 // 60fps in milliseconds

interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children: React.ReactNode[]
  [key: string]: any
}

// Preprocess LaTeX equations
const preprocessLaTeX = (content: string): string => {
  return content.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]').replace(/\$(.*?)\$/g, '\\($1\\)')
}

const MarkdownCode: CodeComponent = ({ node, inline, className, children, ...props }: CodeProps) => {
  if (children.length) {
    if (children[0] === '▍') {
      return <span className="mt-1 cursor-default animate-pulse">▍</span>
    }

    if (typeof children[0] === 'string') {
      children[0] = children[0].replace('`▍`', '▍')
    }
  }

  const match = /language-(\w+)/.exec(className || '')

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <CodeBlock
      key={Math.random()}
      language={(match && match[1]) || ''}
      value={String(children).replace(/\n$/, '')}
      {...props}
    />
  )
}

function BotMessageComponent({
  message,
  messageId,
  isNewMessage = false,
  className
}: {
  message: string
  messageId: string
  isNewMessage?: boolean
  className?: string
}) {
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [isComplete, setIsComplete] = useState(!isNewMessage)
  const [isTyping, setIsTyping] = useState(isNewMessage)
  const frameRef = useRef<number>()
  const lastRenderTime = useRef<number>(0)
  const messageQueue = useRef<string[]>([])
  const renderBuffer = useRef<string>('')

  const renderChunk = useCallback((timestamp: number) => {
    if (!messageQueue.current.length) {
      setIsComplete(true)
      setIsTyping(false)
      return
    }

    // Calculate time since last render
    const deltaTime = timestamp - lastRenderTime.current

    // Only render if enough time has passed
    if (deltaTime >= FRAME_RATE) {
      // Get next chunk
      const chunk = messageQueue.current.splice(0, CHUNK_SIZE).join('')
      renderBuffer.current += chunk

      // Update state with batched content
      setDisplayedMessage(renderBuffer.current)
      lastRenderTime.current = timestamp
    }

    // Schedule next frame
    frameRef.current = requestAnimationFrame(renderChunk)
  }, [])

  useEffect(() => {
    if (!isNewMessage) {
      setDisplayedMessage(message)
      setIsComplete(true)
      setIsTyping(false)
      return
    }

    // Reset state
    setDisplayedMessage('')
    setIsComplete(false)
    setIsTyping(true)
    renderBuffer.current = ''

    // Split message into characters for smoother rendering
    messageQueue.current = message.split('')
    lastRenderTime.current = performance.now()

    // Start rendering loop
    frameRef.current = requestAnimationFrame(renderChunk)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [message, isNewMessage, renderChunk])

  // Memoize markdown components to prevent re-renders
  const markdownComponents = useMemo<Components>(() => ({
    code: MarkdownCode,
    a: Citing,
    h1: ({ node, ...props }) => <h1 className="message-heading-1" {...props} />,
    h2: ({ node, ...props }) => <h2 className="message-heading-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="message-heading-3" {...props} />,
    h4: ({ node, ...props }) => <h4 className="message-heading-4" {...props} />,
    h5: ({ node, ...props }) => <h5 className="message-heading-5" {...props} />,
    h6: ({ node, ...props }) => <h6 className="message-heading-6" {...props} />,
    strong: ({ node, ...props }) => <strong className="message-strong" {...props} />
  }), [])

  const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(
    displayedMessage || ''
  )

  const processedData = useMemo(() => 
    (isComplete || !isNewMessage) ? 
      preprocessLaTeX(displayedMessage || '') : 
      displayedMessage,
    [displayedMessage, isComplete, isNewMessage]
  )

  return (
    <div className={cn(
      'relative message-content',
      isTyping && 'after:content-["▋"] after:ml-0.5 after:animate-pulse after:text-primary',
      className
    )}>
      {containsLaTeX ? (
        <MemoizedReactMarkdown
          rehypePlugins={[
            [rehypeExternalLinks, { target: '_blank' }],
            [rehypeKatex]
          ]}
          remarkPlugins={[remarkGfm, remarkMath]}
          className={cn('prose-sm prose-neutral prose-a:text-accent-foreground/50')}
          components={markdownComponents}
        >
          {processedData}
        </MemoizedReactMarkdown>
      ) : (
        <MemoizedReactMarkdown
          rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
          remarkPlugins={[remarkGfm]}
          className={cn('prose-sm prose-neutral prose-a:text-accent-foreground/50')}
          components={markdownComponents}
        >
          {processedData}
        </MemoizedReactMarkdown>
      )}
    </div>
  )
}

// Memoize for performance
export const BotMessage = memo(BotMessageComponent, (prevProps, nextProps) => 
  prevProps.message === nextProps.message && 
  prevProps.isNewMessage === nextProps.isNewMessage
)

