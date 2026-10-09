import { cn } from '../../lib/utils'
export function Input({ className, ...props }) { return <input className={cn('flex h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground transition-colors disabled:opacity-50', className)} {...props} /> }
