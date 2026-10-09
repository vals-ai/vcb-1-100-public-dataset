import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-muted hover:text-foreground',
      outline: 'border bg-background hover:bg-muted',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    size: { default: 'h-10 px-4 text-sm', sm: 'h-8 px-3 text-sm', lg: 'h-12 px-6', icon: 'size-10' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export function Button({ className, variant, size, ...props }) { return <button className={cn(buttonVariants({ variant, size }), className)} {...props} /> }
