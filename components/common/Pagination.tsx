"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 250],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [1];

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination">
      {/* Left — Summary */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
        <span>
          Showing{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {startItem.toLocaleString("en-IN")}–{endItem.toLocaleString("en-IN")}
          </strong>{" "}
          of{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {totalItems.toLocaleString("en-IN")}
          </strong>{" "}
          stocks
        </span>
      </div>

      {/* Right — Page Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              style={{
                width: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${
                currentPage === page ? "pagination-btn-active" : ""
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
