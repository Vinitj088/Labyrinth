import { Skeleton } from './ui/skeleton'

export function HistorySkeleton() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-2">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-4 w-[40%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
