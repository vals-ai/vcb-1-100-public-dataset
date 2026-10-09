import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, type = 'default') => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { id, message, type }])
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000)
  }, [])
  return <ToastContext.Provider value={toast}>{children}<div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">{toasts.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-card p-4 text-sm shadow-soft">{item.type === 'error' ? <CircleAlert className="size-5 text-destructive"/> : <CheckCircle2 className="size-5 text-primary"/>}<span className="flex-1">{item.message}</span><button aria-label="Dismiss" onClick={() => setToasts((items) => items.filter((x) => x.id !== item.id))}><X className="size-4"/></button></div>)}</div></ToastContext.Provider>
}
export function useToast() { return useContext(ToastContext) }
