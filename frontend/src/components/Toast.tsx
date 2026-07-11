import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; type: ToastType; message: string }

const ToastContext = createContext<{ toast: (type: ToastType, message: string) => void }>({ toast: () => {} })

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-in pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg border max-w-sm ${
              t.type === 'success'
                ? 'bg-accent/10 text-accent border-accent/30'
                : t.type === 'error'
                  ? 'bg-danger/10 text-danger border-danger/30'
                  : 'bg-surface text-text border-border'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
