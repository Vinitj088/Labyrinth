import { FC, memo, useMemo } from 'react'
import ReactMarkdown, { Options } from 'react-markdown'

export const MemoizedReactMarkdown: FC<Options> = memo(
  ({ children, ...props }) => {
    const memoizedContent = useMemo(() => children, [children])
    return <ReactMarkdown {...props}>{memoizedContent}</ReactMarkdown>
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
)

// Add display name
MemoizedReactMarkdown.displayName = 'MemoizedReactMarkdown'
