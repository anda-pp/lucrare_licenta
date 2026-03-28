import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />,
};

function ToastItem({ toast, onDismiss }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div className={`toast-item toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon">{ICONS[toast.type] || ICONS.info}</div>
            <div className="toast-body">
                {toast.title && <strong className="toast-title">{toast.title}</strong>}
                <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}>
                <X size={16} />
            </button>
        </div>
    );
}

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = ++idCounter;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const toast = useMemo(() => ({
        success: (message, title) => addToast({ type: 'success', message, title, duration: 4500 }),
        error: (message, title) => addToast({ type: 'error', message, title, duration: 5500 }),
        info: (message, title) => addToast({ type: 'info', message, title, duration: 4000 }),
    }), [addToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(t => (
                        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}
