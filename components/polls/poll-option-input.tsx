/**
 * @fileoverview Poll Option Input Component
 * Provides input field for poll options with remove functionality
 */

import React from 'react'

interface PollOptionInputProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
  placeholder: string
  canRemove: boolean
}

export function PollOptionInput({ 
  value, 
  onChange, 
  onRemove, 
  placeholder, 
  canRemove 
}: PollOptionInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 text-red-600 hover:text-red-800"
          aria-label="Remove option"
        >
          Remove
        </button>
      )}
    </div>
  )
}