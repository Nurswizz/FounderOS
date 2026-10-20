import { Skeleton, SkeletonHeader, SkeletonRows } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <Skeleton className="mb-8 h-36" />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-7 w-20" />)}
      </div>
      <SkeletonRows count={6} />
    </>
  );
}
