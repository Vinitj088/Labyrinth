'use client'

import { AuthDialog } from '@/components/auth-dialog'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignInPage() {
  const [showDialog, setShowDialog] = useState(true)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl')

  useEffect(() => {
    if (error) {
      // Handle specific error cases
      switch (error) {
        case 'OAuthAccountNotLinked':
          console.error('An account already exists with a different provider')
          break
        default:
          console.error('Authentication error:', error)
      }
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        error={error}
        callbackUrl={callbackUrl || '/'}
      />
    </div>
  )
} 