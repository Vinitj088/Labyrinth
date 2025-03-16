import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
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
          <div className="w-full flex justify-center mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="px-4 py-2">
                  Notice 🎉
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold mb-4">
                    Important Notice 📢
                  </DialogTitle>
                </DialogHeader>

                <p>
                  Hey there! 👋  We want to make sure you have the best experience with our AI, so we&apos;d like to clarify some usage limits.
                </p>

                <p>
                  <strong>GROQ:</strong> Currently, we support a maximum of <span className="text-blue-500">6,000</span> tokens per minute for GROQ queries. ⚡️
                </p>
                <p>
                  <strong>Gemini Models:</strong> You are allowed a maximum of <span className="text-green-500">1,500</span> Requests per Day (RPD) for Gemini models. 💪
                </p>
                <p>
                  <strong>Stock Data API:</strong> We allow a maximum of <span className="text-orange-500">5</span> API requests per minute for retrieving stock data. 📈
                </p>

                <p>
                  Please remember that these limits are in place to comply with the free tier usage limits of the providers.
                  If you require higher usage limits, please don&apos;t hesitate to reach out to our support team. We&apos;re always happy to discuss your specific needs and explore potential solutions.
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
