'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Check your email for reset instructions')
      setEmail('')
    } catch (error) {
      toast.error('Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full rounded border p-2"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Reset Password'}
      </button>
    </form>
  )
} 