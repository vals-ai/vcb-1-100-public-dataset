import { cn } from '../../lib/utils'
export function Skeleton({ className }) { return <div className={cn('animate-pulse rounded-lg bg-muted', className)} /> }
export function PostSkeleton() { return <div className="flex gap-3 border-b p-5"><Skeleton className="size-11 rounded-full"/><div className="flex-1 space-y-3"><Skeleton className="h-4 w-40"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-2/3"/></div></div> }
