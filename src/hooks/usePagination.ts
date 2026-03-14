import { useState, useMemo } from "react";

const PAGE_SIZE = 20;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePageNum = Math.min(page, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((safePageNum - 1) * pageSize, safePageNum * pageSize),
    [items, safePageNum, pageSize]
  );

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(safePageNum + 1);
  const prevPage = () => goToPage(safePageNum - 1);

  return {
    page: safePageNum,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: safePageNum < totalPages,
    hasPrev: safePageNum > 1,
    totalItems: items.length,
    resetPage: () => setPage(1),
  };
}
