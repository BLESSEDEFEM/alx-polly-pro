/**
 * @fileoverview Success Message Component
 * Displays success messages with auto-hide functionality
 */

import React, { useEffect } from 'react'

interface SuccessMessageProps {
  message: string
  onHide?: () => void
}

export function SuccessMessage({ message, onHide }: SuccessMessageProps) {
  useEffect(() => {
    if (onHide) {
      const timer = setTimeout(() => {
        onHide()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [onHide])

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <p className="text-green-600 text-sm">{message}</p>
    </div>
  )
}