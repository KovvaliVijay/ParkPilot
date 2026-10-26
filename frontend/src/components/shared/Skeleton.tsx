
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-panel border border-line rounded-xl p-5 overflow-hidden relative ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[sheen_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
      <div className="h-4 w-1/2 bg-line/50 rounded animate-pulse mb-4" />
      <div className="h-8 w-3/4 bg-line/50 rounded animate-pulse" />
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-9 gap-2">
      {Array.from({ length: 45 }).map((_, i) => (
        <div key={i} className="aspect-square bg-line/30 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

export function SkeletonMap() {
  return (
    <div className="w-full h-full min-h-[300px] bg-panel border border-line rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-[sheen_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
      <div className="w-full h-full bg-line/30 animate-pulse" />
    </div>
  )
}
