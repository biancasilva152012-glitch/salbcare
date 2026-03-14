import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "list" | "dashboard" | "detail";
}

const PageSkeleton = ({ variant = "list" }: PageSkeletonProps) => {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-5 animate-in fade-in">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
};

export default PageSkeleton;
