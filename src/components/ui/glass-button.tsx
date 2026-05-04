import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/components/ui/utils"

/**
 * GlassButton: Glassmorphic button component
 * Features:
 * - Multiple variants (default, outline, ghost)
 * - Glassmorphic effect with backdrop blur
 * - Proper hover and active states
 * - Icon support via asChild
 */

const glassButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "backdrop-blur-md bg-white/15 border border-white/30 text-foreground hover:bg-white/20 hover:border-white/40 active:bg-white/10",
        outline:
          "backdrop-blur-md bg-transparent border border-white/20 text-foreground hover:bg-white/5 hover:border-white/30 active:bg-white/10",
        ghost:
          "bg-transparent text-foreground hover:bg-white/10 active:bg-white/5",
        destructive:
          "backdrop-blur-md bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }
