'use client'

import { History as HistoryIcon, Menu, UserCircle2 } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HistoryListClient } from './history-list-client'
import { HistorySkeleton } from './history-skeleton'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => {
      setHasError(true)
      toast.error('Failed to load chat history')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="text-center py-4 text-sm text-destructive">
        <p>Failed to load history</p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setHasError(false)}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  return children
}

export function HistoryContainer() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const content = (
    <div className="h-full overflow-y-auto px-4">
      {!userId ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">History is disabled</p>
        </div>
      ) : (
        <ErrorBoundary>
          <HistoryListClient userId={userId} />
        </ErrorBoundary>
      )}
    </div>
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="flex items-center gap-1 text-sm font-normal">
            <HistoryIcon size={14} />
            History
          </SheetTitle>
        </SheetHeader>
        {session && (
          <>
            <div className="px-4 py-2 flex items-center gap-2 border-b">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <UserCircle2 className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium truncate">
                {session.user?.name || session.user?.email}
              </span>
            </div>
          </>
        )}
        <div className="h-[calc(100vh-10rem)] overflow-hidden">
          <Suspense fallback={<HistorySkeleton />}>
            {content}
          </Suspense>
        </div>
        {session && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
