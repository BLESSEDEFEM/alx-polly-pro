/**
 * @fileoverview Poll Options List Component
 * Displays a list of poll options with vote counts
 */

import React from 'react'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface PollOptionsListProps {
  options: PollOption[]
  showVotes: boolean
  sortByVotes?: boolean
}

export function PollOptionsList({ options, showVotes, sortByVotes = false }: PollOptionsListProps) {
  if (options.length === 0) {
    return <p className="text-gray-500">No options available</p>
  }

  const sortedOptions = sortByVotes 
    ? [...options].sort((a, b) => b.votes - a.votes)
    : options

  return (
    <div className="space-y-2">
      {sortedOptions.map((option) => (
        <div key={option.id} className="flex justify-between items-center p-3 border rounded-md">
          <span>{option.text}</span>
          {showVotes && (
            <span className="text-gray-600 text-sm">
              {option.votes} vote{option.votes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}