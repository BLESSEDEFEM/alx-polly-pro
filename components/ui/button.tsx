/**
 * @fileoverview Button component with multiple variants and sizes
 * A flexible, accessible button component built with Radix UI and class-variance-authority
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variant styles using class-variance-authority
 * 
 * Defines all possible button appearances and sizes with Tailwind CSS classes.
 * Includes comprehensive styling for different states (hover, focus, disabled, etc.)
 * and supports both light and dark themes.
 */
const buttonVariants = cva(
  // Base styles applied to all button variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      /** Visual style variants for different button types */
      variant: {
        /** Primary button with solid background (default) */
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        /** Destructive actions (delete, remove, etc.) with red styling */
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        /** Outlined button with border and transparent background */
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        /** Secondary button with muted styling */
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        /** Ghost button with no background, only hover effects */
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        /** Link-styled button with underline on hover */
        link: "text-primary underline-offset-4 hover:underline",
      },
      /** Size variants for different button dimensions */
      size: {
        /** Standard button size (default) */
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        /** Small button for compact layouts */
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        /** Large button for prominent actions */
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        /** Square button for icons only */
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button component props interface
 */
interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** 
   * When true, renders as a Slot component instead of a button element.
   * Useful for creating button-styled links or other interactive elements.
   */
  asChild?: boolean
}

/**
 * Flexible button component with multiple variants and sizes
 * 
 * This component provides a consistent button interface across the application
 * with support for different visual styles, sizes, and accessibility features.
 * It can render as either a button element or as a Slot for composition.
 * 
 * @param className - Additional CSS classes to apply
 * @param variant - Visual style variant (default, destructive, outline, secondary, ghost, link)
 * @param size - Size variant (default, sm, lg, icon)
 * @param asChild - Whether to render as a Slot component instead of button
 * @param props - All other standard button props (onClick, disabled, etc.)
 * 
 * @example
 * ```tsx
 * // Basic button
 * <Button onClick={handleClick}>Click me</Button>
 * 
 * // Destructive button
 * <Button variant="destructive" onClick={handleDelete}>
 *   Delete Item
 * </Button>
 * 
 * // Small outlined button
 * <Button variant="outline" size="sm">
 *   Cancel
 * </Button>
 * 
 * // Icon-only button
 * <Button variant="ghost" size="icon">
 *   <TrashIcon />
 * </Button>
 * 
 * // Button as link (using asChild with Next.js Link)
 * <Button asChild>
 *   <Link href="/dashboard">Go to Dashboard</Link>
 * </Button>
 * ```
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
