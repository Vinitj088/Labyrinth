import { cn } from '@/lib/utils'
import { ChevronDown, UserCircle2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from './ui/collapsible'
import { IconLogo } from './ui/icons'
import { Separator } from './ui/separator'

interface CollapsibleMessageProps {
  children: React.ReactNode
  role: 'user' | 'assistant'
  isCollapsible?: boolean
  isOpen?: boolean
  header?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  showBorder?: boolean
  showIcon?: boolean
  className?: string
}

export function CollapsibleMessage({
  children,
  role,
  isCollapsible = false,
  isOpen = true,
  header,
  onOpenChange,
  showBorder = true,
  showIcon = true,
  className
}: CollapsibleMessageProps) {
  const content = <div className="py-2 flex-1">{children}</div>

  return (
    <div className="flex gap-3">
      
        <div className={cn('mt-[10px] w-5', role === 'assistant' && 'mt-4')}>
          {showIcon &&
            (role === 'user' ? (
              <UserCircle2 size={20} className="text-muted-foreground" />
            ) : (
              <IconLogo className="size-5" />
            ))}
        </div>
      

      {isCollapsible ? (
        <div
          className={cn(
            'flex-1 rounded-md p-2 overflow-hidden transition-all duration-300 ease-in-out',
            showBorder && 'border border-border/50',
            className
          )}
        >
          <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="w-full"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center justify-between w-full gap-2">
                {header && <div className="text-sm w-full">{header}</div>}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="transition-all duration-300 ease-in-out overflow-hidden">
              <Separator className="my-4 border-border/50" />
              {content}
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : (
        <div className={cn("flex-1 rounded-2xl px-4 overflow-hidden collapsible-message transition-all duration-300 ease-in-out", className)}>{content}</div>
      )}
    </div>
  )
}
