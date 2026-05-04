import * as React from "react"
import { cn } from "@/components/ui/utils"

/**
 * GlassCard: Reusable glassmorphic card component
 * Features:
 * - Backdrop blur effect for frosted glass appearance
 * - Semi-transparent background with proper contrast
 * - Brand-appropriate borders and shadows
 * - Fully customizable via className
 */

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'elevated' | 'subtle'
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, header, footer, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'backdrop-blur-xl bg-white/10 border border-white/20',
      elevated: 'backdrop-blur-xl bg-white/15 border border-white/30 shadow-lg',
      subtle: 'backdrop-blur-md bg-white/5 border border-white/10',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg transition-all duration-200 hover:border-white/30',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {header && (
          <div className="border-b border-white/10 px-6 py-4">
            {typeof header === 'string' ? (
              <h2 className="text-xl font-bold text-foreground">{header}</h2>
            ) : (
              header
            )}
          </div>
        )}

        <div className={header || footer ? 'px-6 py-4' : ''}>
          {children}
        </div>

        {footer && (
          <div className="border-t border-white/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

GlassCard.displayName = "GlassCard"

export { GlassCard }
