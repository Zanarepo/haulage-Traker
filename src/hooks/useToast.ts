"use client";

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastStore>((set) => ({
    toasts: [],
    showToast: (message, type = 'info') => {
        const id = nextId++;
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, 4000);
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
