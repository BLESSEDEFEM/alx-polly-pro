/**
 * @fileoverview Poll Options Unit Tests
 * Tests poll option creation, validation, and management
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PollOptionInput } from '@/components/polls/poll-option-input'
import { PollOptionsList } from '@/components/polls/poll-options-list'

describe('Poll Options Unit Tests', () => {
  const user = userEvent.setup()

  describe('PollOptionInput', () => {
    const mockOnChange = jest.fn()
    const mockOnRemove = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should render option input with correct value', () => {
      render(
        <PollOptionInput
          value="Test Option"
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          placeholder="Enter option"
          canRemove={true}
        />
      )

      const input = screen.getByDisplayValue('Test Option')
      expect(input).toBeInTheDocument()
    })

    it('should call onChange when input value changes', async () => {
      const mockOnChange = jest.fn()
      render(
        <PollOptionInput
          value=""
          onChange={mockOnChange}
          placeholder="Enter option"
          canRemove={false}
        />
      )

      const input = screen.getByPlaceholderText(/enter option/i)
      await user.clear(input)
      await user.type(input, 'New Option')

      expect(mockOnChange).toHaveBeenCalledTimes(10) // One for each character
      // Check that the function was called with the first and last characters
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'N')
      expect(mockOnChange).toHaveBeenNthCalledWith(10, 'n') // Last character typed
    })

    it('should show remove button when canRemove is true', () => {
      render(
        <PollOptionInput
          value="Test Option"
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          placeholder="Enter option"
          canRemove={true}
        />
      )

      const removeButton = screen.getByRole('button', { name: /remove/i })
      expect(removeButton).toBeInTheDocument()
    })

    it('should not show remove button when canRemove is false', () => {
      render(
        <PollOptionInput
          value="Test Option"
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          placeholder="Enter option"
          canRemove={false}
        />
      )

      const removeButton = screen.queryByRole('button', { name: /remove/i })
      expect(removeButton).not.toBeInTheDocument()
    })

    it('should call onRemove when remove button is clicked', async () => {
      render(
        <PollOptionInput
          value="Test Option"
          onChange={mockOnChange}
          onRemove={mockOnRemove}
          placeholder="Enter option"
          canRemove={true}
        />
      )

      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('PollOptionsList', () => {
    const mockOptions = [
      { id: '1', text: 'Option 1', votes: 5 },
      { id: '2', text: 'Option 2', votes: 3 },
      { id: '3', text: 'Option 3', votes: 8 },
    ]

    it('should render all poll options', () => {
      render(<PollOptionsList options={mockOptions} showVotes={true} />)

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('should show vote counts when showVotes is true', () => {
      render(<PollOptionsList options={mockOptions} showVotes={true} />)

      expect(screen.getByText('5 votes')).toBeInTheDocument()
      expect(screen.getByText('3 votes')).toBeInTheDocument()
      expect(screen.getByText('8 votes')).toBeInTheDocument()
    })

    it('should not show vote counts when showVotes is false', () => {
      render(<PollOptionsList options={mockOptions} showVotes={false} />)

      expect(screen.queryByText('5 votes')).not.toBeInTheDocument()
      expect(screen.queryByText('3 votes')).not.toBeInTheDocument()
      expect(screen.queryByText('8 votes')).not.toBeInTheDocument()
    })

    it('should handle empty options array', () => {
      render(<PollOptionsList options={[]} showVotes={true} />)

      expect(screen.getByText(/no options available/i)).toBeInTheDocument()
    })

    it('should sort options by vote count in descending order', () => {
      render(<PollOptionsList options={mockOptions} showVotes={true} sortByVotes={true} />)

      const optionElements = screen.getAllByText(/Option \d/)
      expect(optionElements[0]).toHaveTextContent('Option 3') // 8 votes
      expect(optionElements[1]).toHaveTextContent('Option 1') // 5 votes
      expect(optionElements[2]).toHaveTextContent('Option 2') // 3 votes
    })
  })
})