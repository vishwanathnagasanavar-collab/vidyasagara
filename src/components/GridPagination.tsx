import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GridPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  rightSlot?: React.ReactNode;
}

export const GridPagination: React.FC<GridPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  rightSlot,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const buildPageNumbers = (): Array<number | 'ellipsis'> => {
    if (totalPages <= 9) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: Array<number | 'ellipsis'> = [];
    if (safePage <= 5) {
      for (let i = 1; i <= 7; i++) items.push(i);
      items.push('ellipsis');
      items.push(totalPages - 2, totalPages - 1, totalPages);
    } else if (safePage >= totalPages - 4) {
      items.push(1, 2, 'ellipsis');
      for (let i = totalPages - 6; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1, 2, 'ellipsis', safePage - 1, safePage, safePage + 1, 'ellipsis', totalPages - 1, totalPages);
    }
    return items;
  };

  const pages = buildPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-white border-t border-b border-[#E5E7EB] text-[12px] text-[#6B7280] select-none">
      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular-nums text-[#6B7280] mr-1">
          Page {safePage} of {totalPages} ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </span>

        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
          className="p-1 text-[#6B7280] hover:text-[#1F2937] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-0.5">
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`el-${idx}`} className="px-1.5 text-[#9CA3AF]">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[24px] h-[24px] px-1.5 text-[12px] tabular-nums rounded-[2px] transition-colors cursor-pointer ${
                  p === safePage
                    ? 'bg-[#F26522] text-white font-semibold'
                    : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
          className="p-1 text-[#6B7280] hover:text-[#1F2937] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {rightSlot}
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">Page size:</span>
          <select
            aria-label="Page size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-[26px] px-2 bg-white border border-[#D1D5DB] rounded-[2px] text-[12px] text-[#374151] tabular-nums focus:outline-none focus:border-[#F26522] cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};
