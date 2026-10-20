import { Skeleton, SkeletonHeader, SkeletonRows } from "@/components/skeleton";

const card = "rounded-lg border border-zinc-200 p-5 dark:border-zinc-800";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <div className={card + " space-y-4"}>
          <Skeleton className="h-4 w-36" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5" />
            </div>
          ))}
        </div>
        <div className={card + " space-y-4"}>
          <Skeleton className="h-4 w-32" />
          <SkeletonRows count={3} />
        </div>
        <div className={card + " space-y-4"}>
          <Skeleton className="h-4 w-20" />
          <SkeletonRows count={3} withIcon={false} />
        </div>
        <div className={card + " space-y-4"}>
          <Skeleton className="h-4 w-28" />
          <SkeletonRows count={2} />
        </div>
      </div>
    </>
  );
}
