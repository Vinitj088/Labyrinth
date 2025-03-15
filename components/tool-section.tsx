'use client'

import { ToolInvocation } from 'ai'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { StockChart } from './stock-chart'
import { ToolBadge } from './tool-badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { VideoSearchSection } from './video-search-section'

interface ToolSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ToolSection({ tool, isOpen, onOpenChange }: ToolSectionProps) {
  switch (tool.toolName) {
    case 'search':
      return (
        <SearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'video_search':
      return (
        <VideoSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'retrieve':
      return (
        <RetrieveSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'getStockData':
      if (tool.state === 'result' && tool.result) {
        return (
          <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="mb-4 mt-2"
          >
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <ToolBadge
                  tool="getStockData"
                  className="cursor-pointer"
                >
                  Stock Data
                </ToolBadge>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <StockChart data={tool.result} />
            </CollapsibleContent>
          </Collapsible>
        )
      }
      return null
    default:
      return null
  }
}
