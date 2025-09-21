/**
 * @fileoverview UI/UX Behavior Unit Tests
 * Tests user interface interactions, loading states, and user experience
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SuccessMessage } from '@/components/ui/success-message'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

describe('UI/UX Behavior Unit Tests', () => {
  const user = userEvent.setup()

  describe('Loading States', () => {
    it('should render loading spinner with correct text', () => {
      render(<LoadingSpinner text="Loading polls..." />)
      
      expect(screen.getByText('Loading polls...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render loading spinner without text', () => {
      render(<LoadingSpinner />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    it('should show loading state on button when loading', () => {
      render(<Button loading={true}>Submit</Button>)
      
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show normal button when not loading', () => {
      render(<Button loading={false}>Submit</Button>)
      
      expect(screen.getByRole('button')).not.toBeDisabled()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should render error message with correct styling', () => {
      render(<ErrorMessage message="Something went wrong" />)
      
      const errorElement = screen.getByText('Something went wrong')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveClass('text-red-600')
    })

    it('should render error message with dismiss button', () => {
      const mockOnDismiss = jest.fn()
      render(<ErrorMessage message="Error occurred" onDismiss={mockOnDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      expect(dismissButton).toBeInTheDocument()
    })

    it('should call onDismiss when dismiss button is clicked', async () => {
      const mockOnDismiss = jest.fn()
      render(<ErrorMessage message="Error occurred" onDismiss={mockOnDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })

    it('should auto-dismiss error after timeout', async () => {
      const mockOnDismiss = jest.fn()
      render(<ErrorMessage message="Error occurred" onDismiss={mockOnDismiss} autoHide={true} />)
      
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1)
      }, { timeout: 6000 })
    })
  })

  describe('Success Messages', () => {
    it('should render success message with correct styling', () => {
      render(<SuccessMessage message="Operation successful" />)
      
      const successElement = screen.getByText('Operation successful')
      expect(successElement).toBeInTheDocument()
      expect(successElement).toHaveClass('text-green-600')
    })

    it('should auto-hide success message', async () => {
      const mockOnHide = jest.fn()
      render(<SuccessMessage message="Success!" onHide={mockOnHide} />)
      
      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalledTimes(1)
      }, { timeout: 4000 })
    })
  })

  describe('Modal Behavior', () => {
    it('should render modal when open', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      render(
        <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const mockOnClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when overlay is clicked', async () => {
      const mockOnClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      
      const overlay = screen.getByTestId('modal-overlay')
      await user.click(overlay)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should trap focus within modal', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      )
      
      const firstButton = screen.getByText('First Button')
      const secondButton = screen.getByText('Second Button')
      const closeButton = screen.getByLabelText('Close modal')
      
      // Focus should start on first focusable element (close button)
      expect(closeButton).toHaveFocus()
      
      // Tab should move to first content button
      await user.tab()
      expect(firstButton).toHaveFocus()
      
      // Tab should move to second content button
      await user.tab()
      expect(secondButton).toHaveFocus()
      
      // Tab should wrap around to close button
      await user.tab()
      expect(closeButton).toHaveFocus()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render button with responsive variant', () => {
      render(<Button variant="responsive">Click me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('should render button with default styling', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })
  })
})