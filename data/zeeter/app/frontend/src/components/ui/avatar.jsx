import { UserRound } from 'lucide-react'
import { cn } from '../../lib/utils'
export function Avatar({ src, alt = '', fallback = '', className }) { return <div className={cn('flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold text-accent-foreground', className)}>{src ? <img src={src} alt={alt} className="size-full object-cover" /> : fallback ? fallback.slice(0, 2).toUpperCase() : <UserRound className="size-5" />}</div> }
