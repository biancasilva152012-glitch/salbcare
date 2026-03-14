import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

const ListPagination = ({ page, totalPages, totalItems, hasNext, hasPrev, onNext, onPrev }: ListPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-muted-foreground">{totalItems} itens</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!hasPrev} onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground">{page}/{totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!hasNext} onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ListPagination;
