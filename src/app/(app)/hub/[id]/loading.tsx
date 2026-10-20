import { Skeleton, SkeletonHeader } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="mb-6 h-4 w-16" />
      <SkeletonHeader />
      <div className="space-y-3">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-4" style={{ width: `${60 + ((i * 13) % 40)}%` }} />)}
      </div>
    </div>
  );
}
