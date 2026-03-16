import { ReactNode, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
}

const PageContainer = ({ children, className = "", onRefresh }: PageContainerProps) => {
  const { scrollRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
  });

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      scrollRef.current = el;
    },
    [scrollRef]
  );

  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div className={`flex flex-col h-[100dvh] overflow-hidden ${className}`}>
      <main
        ref={setRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 bottom-nav-safe"
        style={{ WebkitOverflowScrolling: "touch" as any }}
      >
        {/* Pull-to-refresh indicator */}
        {showIndicator && (
          <div
            className="flex items-center justify-center transition-all duration-200 ease-out overflow-hidden"
            style={{ height: pullDistance }}
          >
            <div
              className={`rounded-full bg-primary/10 p-2 transition-transform duration-200 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
                opacity: Math.min(pullDistance / 40, 1),
              }}
            >
              <Loader2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
        <div className="mx-auto max-w-lg pb-2">{children}</div>
      </main>
    </div>
  );
};

export default PageContainer;
