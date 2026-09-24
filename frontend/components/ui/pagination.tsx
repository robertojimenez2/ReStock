"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  skip: number;
  limit: number;
  hasNext: boolean;
  onPageChange: (newSkip: number) => void;
}

export function Pagination({
  skip,
  limit,
  hasNext,
  onPageChange,
}: PaginationProps) {
  const currentPage = Math.floor(skip / limit) + 1;
  const hasPrev = skip > 0;

  if (!hasPrev && !hasNext) return null;

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700/50">
      <p className="text-xs text-neutral-500">
        Página <span className="font-mono">{currentPage}</span>
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(Math.max(0, skip - limit))}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(skip + limit)}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}