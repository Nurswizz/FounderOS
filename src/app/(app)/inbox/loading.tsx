import { SkeletonHeader, SkeletonRows } from "@/components/skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"><SkeletonRows count={3} /></div>
        ))}
      </div>
    </>
  );
}
