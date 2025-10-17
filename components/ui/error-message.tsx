/**
 * @fileoverview Error Message Component
 * Displays error messages with optional dismiss functionality
 */

import React, { useEffect } from 'react'

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  autoHide?: boolean
}

export function ErrorMessage({ message, onDismiss, autoHide = false }: ErrorMessageProps) {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoHide, onDismiss])

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center justify-between">
      <p className="text-red-600 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 ml-4"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  )
}