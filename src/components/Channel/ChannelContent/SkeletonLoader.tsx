import { Skeleton } from "~/components/ui/skeleton";

export default function SkeletonLoader() {
  return (
    <div class="flex flex-row gap-4">
      <Skeleton height={40} width={40} radius={10} animate={false} />
      <div class="flex flex-col gap-2">
        <Skeleton height={24} width={96} radius={10} />
        <Skeleton height={24} width={256} radius={10} />
        <Skeleton height={24} width={300} radius={10} />
      </div>
    </div>
  )
}
