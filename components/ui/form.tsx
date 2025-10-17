/**
 * @fileoverview Form components built on React Hook Form and Radix UI
 * Provides a comprehensive set of form components with built-in validation and accessibility
 */

"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Form provider component (alias for React Hook Form's FormProvider)
 * 
 * Provides form context to all child components. This should wrap your entire form.
 * 
 * @example
 * ```tsx
 * const form = useForm<FormData>()
 * 
 * <Form {...form}>
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <FormField
 *       control={form.control}
 *       name="email"
 *       render={({ field }) => (
 *         <FormItem>
 *           <FormLabel>Email</FormLabel>
 *           <FormControl>
 *             <Input {...field} />
 *           </FormControl>
 *         </FormItem>
 *       )}
 *     />
 *   </form>
 * </Form>
 * ```
 */
const Form = FormProvider

/**
 * Context value for form field information
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  /** The name of the form field */
  name: TName
}

/**
 * Context for sharing form field information between components
 */
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

/**
 * Form field component that wraps React Hook Form's Controller
 * 
 * Provides field-level context and validation. This component connects
 * your form inputs to React Hook Form's validation and state management.
 * 
 * @param props - Controller props from React Hook Form
 * 
 * @example
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="username"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Username</FormLabel>
 *       <FormControl>
 *         <Input placeholder="Enter username" {...field} />
 *       </FormControl>
 *       <FormDescription>
 *         This will be your public display name.
 *       </FormDescription>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 * ```
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * Hook to access form field state and metadata
 * 
 * Provides access to field validation state, IDs for accessibility,
 * and other field-specific information. Must be used within a FormField.
 * 
 * @returns Object containing field state and accessibility IDs
 * @throws Error if used outside of FormField context
 * 
 * @example
 * ```tsx
 * function CustomFormInput() {
 *   const { error, formItemId } = useFormField()
 *   
 *   return (
 *     <input
 *       id={formItemId}
 *       aria-invalid={!!error}
 *       className={error ? 'border-red-500' : ''}
 *     />
 *   )
 * }
 * ```
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/**
 * Context value for form item information
 */
type FormItemContextValue = {
  /** Unique ID for the form item */
  id: string
}

/**
 * Context for sharing form item information between components
 */
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/**
 * Form item container component
 * 
 * Provides a container for form field components with consistent spacing
 * and generates unique IDs for accessibility. Should contain FormLabel,
 * FormControl, FormDescription, and FormMessage components.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other standard div props
 * 
 * @example
 * ```tsx
 * <FormItem>
 *   <FormLabel>Email Address</FormLabel>
 *   <FormControl>
 *     <Input type="email" />
 *   </FormControl>
 *   <FormDescription>
 *     We'll never share your email with anyone else.
 *   </FormDescription>
 *   <FormMessage />
 * </FormItem>
 * ```
 */
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

/**
 * Form label component with error state styling
 * 
 * Displays the label for a form field with automatic error styling
 * and proper accessibility attributes. Automatically links to the
 * associated form control.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other label props
 * 
 * @example
 * ```tsx
 * <FormLabel>Password</FormLabel>
 * ```
 */
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

/**
 * Form control wrapper component
 * 
 * Wraps form input elements and provides proper accessibility attributes
 * including ARIA descriptions and invalid states. Use this to wrap your
 * actual input components (Input, Select, Textarea, etc.).
 * 
 * @param props - Slot component props
 * 
 * @example
 * ```tsx
 * <FormControl>
 *   <Input type="password" placeholder="Enter your password" />
 * </FormControl>
 * ```
 */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

/**
 * Form description component for help text
 * 
 * Displays helpful information about the form field. This text is
 * automatically linked to the form control via ARIA attributes.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other paragraph props
 * 
 * @example
 * ```tsx
 * <FormDescription>
 *   Password must be at least 8 characters long.
 * </FormDescription>
 * ```
 */
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Form message component for validation errors
 * 
 * Displays validation error messages with destructive styling.
 * Automatically shows the error message from React Hook Form's validation
 * or custom children content. Only renders when there's an error or children.
 * 
 * @param className - Additional CSS classes to apply
 * @param props - All other paragraph props
 * 
 * @example
 * ```tsx
 * <FormMessage />
 * 
 * // Or with custom content
 * <FormMessage>Custom error message</FormMessage>
 * ```
 */
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
