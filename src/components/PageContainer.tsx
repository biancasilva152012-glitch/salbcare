import { ReactNode, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import BackButton from "@/components/BackButton";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
  /** Show a themed back arrow at the top. Pass string to set a fixed destination. */
  backTo?: string | boolean;
  backLabel?: string;
}

const PageContainer = ({ children, className = "", onRefresh, backTo, backLabel }: PageContainerProps) => {
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
    <div className={`flex flex-col min-h-[100dvh] ${className}`}>
      <main
        ref={setRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-20"
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
        <div className="mx-auto max-w-lg pb-2">
          {backTo && (
            <BackButton
              to={typeof backTo === "string" ? backTo : undefined}
              label={backLabel}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageContainer;
