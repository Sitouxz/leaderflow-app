'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
    toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastContainer() {
    const { toasts, hideToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-3 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300
                        ${toast.type === 'success' ? 'bg-emerald-500 text-black' : ''}
                        ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
                        ${toast.type === 'warning' ? 'bg-yellow-500 text-black' : ''}
                        ${toast.type === 'info' ? 'bg-surface-dark border border-white/10 text-white' : ''}
                    `}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {toast.type === 'success' && 'check_circle'}
                        {toast.type === 'error' && 'error'}
                        {toast.type === 'warning' && 'warning'}
                        {toast.type === 'info' && 'info'}
                    </span>
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                    <button
                        onClick={() => hideToast(toast.id)}
                        className="p-1 hover:bg-black/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                </div>
            ))}
        </div>
    );
}
