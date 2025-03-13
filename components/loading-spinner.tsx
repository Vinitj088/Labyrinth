export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  )
} 