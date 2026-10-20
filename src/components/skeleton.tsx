export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={"animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900 " + className} />;
}

export function SkeletonHeader() {
  return (
    <div className="mb-8 space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export function SkeletonRows({ count = 5, withIcon = true }: { count?: number; withIcon?: boolean }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-3">
          {withIcon ? <Skeleton className="size-4 shrink-0 rounded-full" /> : null}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
