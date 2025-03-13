'use client'

import { Suspense } from 'react'
import { HistoryList } from './history-list'
import { HistorySkeleton } from './history-skeleton'

interface HistoryListClientProps {
  userId?: string
}

export function HistoryListClient({ userId }: HistoryListClientProps) {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryList userId={userId} />
    </Suspense>
  )
} 