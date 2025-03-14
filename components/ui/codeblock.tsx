// Referenced from Vercel's AI Chatbot and modified to fit the needs of this project
// https://github.com/vercel/ai-chatbot/blob/c2757f87f986b7f15fdf75c4c89cb2219745c53f/components/ui/codeblock.tsx

'use client'

import { FC, memo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { generateId } from 'ai'
import { AlignJustify, Check, Copy, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const [wrap, setWrap] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateId()}${fileExtension}`
    const fileName = window.prompt('Enter file name', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    
    try {
      // Copy the entire code value
      copyToClipboard(value)
      
      // Show a toast notification for better feedback
      if (typeof toast !== 'undefined') {
        toast.success('Code copied to clipboard', {
          duration: 2000,
          position: 'bottom-right'
        })
      }
    } catch (error) {
      console.error('Failed to copy code to clipboard', error)
      if (typeof toast !== 'undefined') {
        toast.error('Failed to copy code', {
          duration: 2000,
          position: 'bottom-right'
        })
      }
    }
  }

  const toggleWrap = () => {
    setWrap(!wrap)
  }

  return (
    <div className="relative w-full font-sans codeblock rounded-md overflow-hidden border border-border/50">
      <div className="flex items-center justify-between w-full px-4 py-1.5 bg-muted/50 text-muted-foreground">
        <span className="text-xs font-medium">{language}</span>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs focus-visible:ring-1 focus-visible:ring-offset-0 hover:bg-muted"
            onClick={toggleWrap}
            title="Toggle word wrap"
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span className="sr-only">Toggle word wrap</span>
          </Button>
          <Button
            variant="ghost"
            className="h-7 w-7 focus-visible:ring-1 focus-visible:ring-offset-0 hover:bg-muted"
            onClick={downloadAsFile}
            size="icon"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 text-xs focus-visible:ring-1 focus-visible:ring-offset-0 hover:bg-muted transition-colors",
              isCopied && "text-green-500"
            )}
            onClick={onCopy}
            title={isCopied ? "Copied!" : "Copy code"}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <div className={cn("relative", isDark ? "bg-zinc-950" : "bg-zinc-50")}>
        <SyntaxHighlighter
          language={language}
          style={isDark ? coldarkDark : oneLight}
          PreTag="div"
          showLineNumbers
          customStyle={{
            margin: 0,
            width: '100%',
            background: 'transparent',
            padding: '1rem 0.75rem'
          }}
          lineNumberStyle={{
            userSelect: 'none',
            minWidth: '2.5em',
            paddingRight: '1em',
            fontSize: '0.8rem',
            opacity: 0.5
          }}
          codeTagProps={{
            style: {
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)'
            }
          }}
          wrapLines={wrap}
          wrapLongLines={wrap}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }

