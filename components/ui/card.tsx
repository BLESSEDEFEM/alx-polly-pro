/**
 * @fileoverview Card component system for displaying content in containers
 * A comprehensive set of card components for creating consistent content containers
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Main card container component
 * 
 * Provides the base container for card content with consistent styling,
 * rounded corners, shadow, and proper spacing for child components.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main card content goes here
 *   </CardContent>
 * </Card>
 * ```
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Card header component for titles, descriptions, and actions
 * 
 * Contains the card's title, description, and optional action elements.
 * Uses CSS Grid to automatically layout title/description on the left
 * and actions on the right when CardAction is present.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Poll Results</CardTitle>
 *   <CardDescription>View the current voting results</CardDescription>
 *   <CardAction>
 *     <Button variant="outline" size="sm">Edit</Button>
 *   </CardAction>
 * </CardHeader>
 * ```
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Card title component for primary heading text
 * 
 * Displays the main title/heading for the card with consistent typography.
 * Should be used within CardHeader for proper layout.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardTitle>What's your favorite programming language?</CardTitle>
 * ```
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Card description component for secondary text
 * 
 * Displays descriptive text below the title with muted styling.
 * Should be used within CardHeader for proper layout.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardDescription>
 *   Choose your preferred language for web development
 * </CardDescription>
 * ```
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Card action component for interactive elements in the header
 * 
 * Contains action buttons or controls that should appear in the top-right
 * corner of the card header. Automatically positioned using CSS Grid.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardAction>
 *   <Button variant="ghost" size="icon">
 *     <MoreHorizontalIcon />
 *   </Button>
 * </CardAction>
 * ```
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Card content component for main body content
 * 
 * Contains the primary content of the card with consistent horizontal padding.
 * This is where the main information, forms, lists, or other content should go.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardContent>
 *   <div className="space-y-4">
 *     <div>Option 1: JavaScript (45%)</div>
 *     <div>Option 2: TypeScript (35%)</div>
 *     <div>Option 3: Python (20%)</div>
 *   </div>
 * </CardContent>
 * ```
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * Card footer component for bottom actions or metadata
 * 
 * Contains footer content like action buttons, timestamps, or other metadata.
 * Automatically adds top padding when a border-top class is present.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <CardFooter className="border-t">
 *   <div className="flex justify-between w-full">
 *     <span className="text-sm text-muted-foreground">
 *       Created 2 hours ago
 *     </span>
 *     <Button>Vote Now</Button>
 *   </div>
 * </CardFooter>
 * ```
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
