'use client'

import { cn } from '@/lib/utils'
import { UserCircle2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthDialog } from './auth-dialog'
import { HistoryContainer } from './history-container'
import { ModeToggle } from './mode-toggle'
import { Button } from './ui/button'
import { IconLogo } from './ui/icons'

export const Header = () => {
  const { data: session } = useSession()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <header className="fixed w-full p-2 flex justify-between items-center z-10 backdrop-blur lg:backdrop-blur-none bg-background/80 lg:bg-transparent">
      <div>
        <a href="/">
          <IconLogo className={cn('w-5 h-5')} />
          <span className="sr-only">Labyrinth</span>
        </a>
      </div>
      <div className="flex gap-0.5 items-center">
        <ModeToggle />
        {!session && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAuthDialog(true)}
          >
            <UserCircle2 className="w-5 h-5" />
          </Button>
        )}
        <HistoryContainer />
      </div>
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => setShowAuthDialog(false)}
      />
    </header>
  )
}

export default Header
