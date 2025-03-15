'use client'

import { useStockMode } from '@/lib/context/stock-mode-context'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import { Toggle } from './ui/toggle'

export function StockModeToggle() {
  const { isStockModeEnabled, toggleStockMode } = useStockMode()

  return (
    <Toggle
      aria-label="Toggle stock mode"
      pressed={isStockModeEnabled}
      onPressedChange={toggleStockMode}
      variant="outline"
      className={cn(
        'gap-1 px-2 sm:px-3 border border-input text-muted-foreground bg-background',
        'data-[state=on]:bg-success',
        'data-[state=on]:text-success-foreground',
        'data-[state=on]:border-success',
        'hover:bg-success hover:text-success-foreground rounded-lg',
        'touch-manipulation select-none active:scale-95 transition-transform',
        'tap-highlight-transparent'
      )}
    >
      <TrendingUp className="size-4" />
      <span className="hidden sm:inline-block text-xs">Stocks</span>
    </Toggle>
  )
} 