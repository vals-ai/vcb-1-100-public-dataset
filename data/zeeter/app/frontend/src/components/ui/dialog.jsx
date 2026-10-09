import { X } from 'lucide-react'
import { Button } from './button'

export function Dialog({ open, onClose, title, description, children }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow-soft"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div><Button aria-label="Close" size="icon" variant="ghost" onClick={onClose}><X className="size-4"/></Button></div><div className="mt-5">{children}</div></div></div>
}
