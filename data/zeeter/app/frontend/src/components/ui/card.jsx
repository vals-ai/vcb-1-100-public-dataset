import { cn } from '../../lib/utils'
export function Card({ className, ...props }) { return <div className={cn('rounded-xl border bg-card text-card-foreground shadow-soft', className)} {...props} /> }
export function CardHeader({ className, ...props }) { return <div className={cn('p-6 pb-3', className)} {...props} /> }
export function CardContent({ className, ...props }) { return <div className={cn('p-6 pt-3', className)} {...props} /> }
