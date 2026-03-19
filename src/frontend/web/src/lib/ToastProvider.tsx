import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastVariant = "success" | "danger" | "warning" | "info";

interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
    fading: boolean;
}

interface ToastApi {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        // Start fade-out
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, fading: true } : t))
        );
        // Remove after CSS transition (300ms)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const show = useCallback(
        (message: string, variant: ToastVariant) => {
            const id = nextId.current++;
            setToasts((prev) => [...prev, { id, message, variant, fading: false }]);
            setTimeout(() => dismiss(id), 5000);
        },
        [dismiss]
    );

    const api: ToastApi = {
        success: (msg) => show(msg, "success"),
        error: (msg) => show(msg, "danger"),
        warning: (msg) => show(msg, "warning"),
        info: (msg) => show(msg, "info"),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                style={{
                    position: "fixed",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    minWidth: "280px",
                    maxWidth: "420px",
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`alert alert-${t.variant} alert-dismissible`}
                        style={{
                            opacity: t.fading ? 0 : 1,
                            transition: "opacity 0.3s ease",
                            marginBottom: 0,
                        }}
                        role="alert"
                    >
                        {t.message}
                        <button
                            type="button"
                            className="close"
                            aria-label="Close"
                            onClick={() => dismiss(t.id)}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
