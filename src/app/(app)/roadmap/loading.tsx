import { Skeleton, SkeletonHeader, SkeletonRows } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <section key={i} className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-1.5 flex-1" />
            </div>
            <SkeletonRows count={4} />
          </section>
        ))}
      </div>
    </>
  );
}
