"use client";

import { useState, useMemo, useEffect } from 'react';

interface UsePaginationReturn<T> {
    paginatedItems: T[];
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
}

export function usePagination<T>(items: T[], pageSize: number = 10): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(1);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Reset to page 1 when items change (e.g. after filtering)
    useEffect(() => {
        setCurrentPage(1);
    }, [totalItems]);

    // Clamp current page to valid range
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const paginatedItems = useMemo(() => {
        return items.slice(startIndex, endIndex);
    }, [items, startIndex, endIndex]);

    return {
        paginatedItems,
        currentPage: safePage,
        setCurrentPage,
        totalPages,
        startIndex,
        endIndex,
        totalItems,
    };
}
