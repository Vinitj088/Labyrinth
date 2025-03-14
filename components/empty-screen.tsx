import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
const exampleMessages = [
  {
    heading: 'What are the main causes of the American Civil War?',
    message: 'What are the main causes of the American Civil War?'
  },
  {
    heading: 'Write a short story about a cat who goes on an adventure in a magical forest.',
    message: 'Write a short story about a cat who goes on an adventure in a magical forest.'
  },
  {
    heading: 'Write a Python function to check if a string is a palindrome.',
    message: 'Write a Python function to check if a string is a palindrome.'
  },
  {
    heading: 'What are some effective strategies for overcoming procrastination?',
    message: 'What are some effective strategies for overcoming procrastination?'
  },
  {
    heading: 'Tell me a joke.',
    message: 'Tell me a joke.'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-2 flex flex-col items-start space-y-2 mb-4 w-full">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-muted-foreground text-left whitespace-normal break-words w-full justify-start"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-accent flex-shrink-0" />
              <span className="line-clamp-2">{message.heading}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
