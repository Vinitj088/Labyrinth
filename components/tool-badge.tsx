import { cn } from '@/lib/utils'
import { LineChart, Link, Search, Video } from 'lucide-react'
import React from 'react'

type ToolBadgeProps = {
  tool: string
  children: React.ReactNode
  className?: string
}

export const ToolBadge: React.FC<ToolBadgeProps> = ({
  tool,
  children,
  className
}) => {
  const icon: Record<string, React.ReactNode> = {
    search: <Search size={14} className="flex-shrink-0" />,
    retrieve: <Link size={14} className="flex-shrink-0" />,
    video_search: <Video size={14} className="flex-shrink-0" />,
    getStockData: <LineChart size={14} className="flex-shrink-0" />
  }

  return (
    <div className={cn("bg-background border border-border rounded-md py-1 px-3 flex items-center gap-2 text-xs shadow-sm", className)}>
      <div className="flex items-center gap-1.5">
        {icon[tool]}
        <span className="font-medium text-foreground">{children}</span>
      </div>
    </div>
  )
}
