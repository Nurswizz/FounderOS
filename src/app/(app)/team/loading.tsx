import { Skeleton, SkeletonHeader, SkeletonRows } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex gap-3">
              <Skeleton className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-20" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <SkeletonRows count={4} />
      </div>
    </>
  );
}
