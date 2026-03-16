import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => (
  <div className={`flex flex-col h-[100dvh] overflow-hidden ${className}`}>
    <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 bottom-nav-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="mx-auto max-w-lg pb-2">{children}</div>
    </main>
  </div>
);

export default PageContainer;
