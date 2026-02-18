"use client";

import './DataTable.css';
import React from 'react';
import { Search, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface DataTableColumn<T> {
    key: string;
    label: string;
    /** Custom render for each cell */
    render?: (item: T) => React.ReactNode;
    /** Label shown on mobile cards (defaults to label) */
    mobileLabel?: string;
    /** If true, cell uses data-full attr for full-width on mobile */
    fullWidth?: boolean;
    /** Hide this column on mobile card view */
    hideOnMobile?: boolean;
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
}

export interface DataTableFilter {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    /** Controlled search */
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    /** Filter dropdowns */
    filters?: DataTableFilter[];
    /** Header-right actions (e.g. Add button) */
    actions?: React.ReactNode;
    /** Rows per page */
    pageSize?: number;
    /** Loading state */
    loading?: boolean;
    /** Empty state icon */
    emptyIcon?: React.ReactNode;
    /** Empty state message */
    emptyMessage?: string;
    /** On row click handler */
    onRowClick?: (item: T) => void;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export default function DataTable<T>({
    columns,
    data,
    keyExtractor,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    actions,
    pageSize = 10,
    loading = false,
    emptyIcon,
    emptyMessage = 'No results found.',
    onRowClick,
}: DataTableProps<T>) {
    const {
        paginatedItems,
        currentPage,
        setCurrentPage,
        totalPages,
        startIndex,
        endIndex,
        totalItems,
    } = usePagination(data, pageSize);

    return (
        <div>
            {/* ─── Toolbar ─────────────────────────── */}
            <div className="dt-toolbar">
                <div className="dt-toolbar-left">
                    {/* Search */}
                    {onSearchChange && (
                        <div className="dt-search">
                            <Search size={14} className="dt-search-icon" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchValue || ''}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            {searchValue && (
                                <button
                                    className="dt-search-clear"
                                    onClick={() => onSearchChange('')}
                                    type="button"
                                    aria-label="Clear search"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Filters — wrapped for side-by-side on mobile */}
                    {filters && filters.length > 0 && (
                        <div className="dt-filters-row">
                            {filters.map((filter, idx) => (
                                <div key={idx} className="dt-filter">
                                    <span className="dt-filter-label">{filter.label}</span>
                                    <select
                                        value={filter.value}
                                        onChange={(e) => filter.onChange(e.target.value)}
                                    >
                                        {filter.options.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {actions && <div className="dt-toolbar-right">{actions}</div>}
            </div>

            {/* ─── Table ───────────────────────────── */}
            <div className="dt-wrapper">
                {loading ? (
                    <div className="dt-loading">
                        <Loader2 size={18} className="dt-spin" /> Loading...
                    </div>
                ) : totalItems === 0 ? (
                    <div className="dt-empty">
                        {emptyIcon && <div className="dt-empty-icon">{emptyIcon}</div>}
                        {emptyMessage}
                    </div>
                ) : (
                    <>
                        <table className="dt-table">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col.key} style={{ textAlign: col.align || 'left' }}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.map((item) => (
                                    <tr
                                        key={keyExtractor(item)}
                                        onClick={() => onRowClick?.(item)}
                                        className={onRowClick ? 'dt-clickable-row' : ''}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                data-label={col.mobileLabel || col.label}
                                                style={{ textAlign: col.align || 'left' }}
                                                {...(col.fullWidth ? { 'data-full': '' } : {})}
                                                {...(col.hideOnMobile ? { 'data-hide-mobile': '' } : {})}
                                            >
                                                {col.render
                                                    ? col.render(item)
                                                    : (item as any)[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ─── Pagination ──────────────────── */}
                        {totalPages > 1 && (
                            <div className="dt-pagination">
                                <span className="dt-pagination-info">
                                    Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of{' '}
                                    <strong>{totalItems}</strong>
                                </span>

                                <div className="dt-pagination-controls">
                                    <button
                                        className="dt-page-nav"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>

                                    {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                                        page === '...' ? (
                                            <span key={`e-${idx}`} className="dt-page-ellipsis">
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                className={`dt-page-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(page as number)}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        className="dt-page-nav"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function generatePageNumbers(current: number, total: number): (number | string)[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) pages.push('...');

    pages.push(total);

    return pages;
}
