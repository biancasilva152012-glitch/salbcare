import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => (
  <div className={`min-h-screen bottom-nav-safe px-4 pt-6 pb-4 ${className}`}>
    <div className="mx-auto max-w-lg">{children}</div>
  </div>
);

export default PageContainer;
