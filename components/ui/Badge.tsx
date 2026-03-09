import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'gray' | 'purple'
  className?: string
}

const variantStyles = {
  blue: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
