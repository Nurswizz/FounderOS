import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <div className="space-y-5 lg:w-1/2 2xl:w-1/3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex gap-4">
          <Skeleton className="size-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </>
  );
}
