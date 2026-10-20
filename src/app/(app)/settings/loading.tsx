import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-5 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-44" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
