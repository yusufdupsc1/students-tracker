export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-white p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="h-8 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-full" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-white overflow-hidden">
      <div className="h-12 bg-gray-50 border-b border-gray-100" />
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <div className="h-4 bg-gray-100 rounded w-12" />
            <div className="h-4 bg-gray-100 rounded flex-1" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded-xl w-48" />
      <div className="h-4 bg-gray-100 rounded w-96 max-w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-[1.5rem]" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-[1.5rem]" />
    </div>
  )
}
