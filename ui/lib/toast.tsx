"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
    toasts: [],
    addToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`px-5 py-3.5 rounded-lg text-sm font-medium shadow-lg border transition-all animate-[fadeIn_0.2s_ease-out] ${t.type === "success"
                                ? "bg-white text-success border-success/20"
                                : t.type === "error"
                                    ? "bg-white text-error border-error/20"
                                    : "bg-white text-text-primary border-border"
                            }`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
