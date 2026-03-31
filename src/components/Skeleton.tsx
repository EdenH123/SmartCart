export function SkeletonLine({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return <div className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} style={{ width }} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" />
          <SkeletonLine width="40%" />
        </div>
      </div>
    </div>
  );
}

export function BasketSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLine width="120px" className="h-7" />
        <SkeletonLine width="80px" className="h-9 rounded-xl" />
      </div>
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function CompareSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <SkeletonLine width="200px" className="h-7" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
            <SkeletonLine width="50%" className="h-6" />
            <SkeletonLine width="30%" className="h-8" />
            <div className="space-y-2 pt-2">
              <SkeletonLine width="100%" />
              <SkeletonLine width="80%" />
              <SkeletonLine width="90%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OptimizeSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <SkeletonLine width="180px" className="h-7" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
        <SkeletonLine width="40%" className="h-6" />
        <SkeletonLine width="25%" className="h-10" />
      </div>
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
