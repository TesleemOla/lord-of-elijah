import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    
    const variants = {
      default: "bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-primary/50 transition-all",
      outline: "border border-[var(--border)] hover:bg-[#27272a] text-foreground",
      ghost: "hover:bg-[#27272a] text-foreground",
      danger: "bg-red-600/80 text-white hover:bg-red-600 shadow-lg hover:shadow-red-600/50",
    };
    
    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
