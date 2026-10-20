import { Skeleton, SkeletonRows } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <Skeleton className="mb-6 h-4 w-24" />
      <div className="mb-8 flex gap-4">
        <Skeleton className="size-10" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
        <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"><SkeletonRows count={5} /></div>
      </div>
    </>
  );
}
