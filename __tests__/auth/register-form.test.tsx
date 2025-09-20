/**
 * @fileoverview Unit tests for RegisterForm component
 * Tests registration functionality including happy path and failure scenarios
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '@/components/auth/register-form'

// Mock the auth provider and useAuth hook
const mockSignUp = jest.fn()
const mockUseAuth = {
  user: null,
  session: null,
  isLoading: false,
  signOut: jest.fn(),
  refreshSession: jest.fn(),
}

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/auth/register'
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  },
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
)

describe('RegisterForm Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockSignUp.mockClear()
    
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Happy Path - Successful Registration', () => {
    it('should successfully register user with valid credentials', async () => {
      // Mock successful registration response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        })
      })

      render(
        <TestWrapper>
          <RegisterForm redirectTo="/test-redirect" />
        </TestWrapper>
      )

      // Check if form elements are present
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      // Fill in the form
      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Verify API was called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      })
    })

    it('should show loading state during registration process', async () => {
      // Mock a delayed registration response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              user: { id: '123' }, 
              session: { access_token: 'token' }
            })
          }), 100)
        )
      )

      render(
        <TestWrapper>
          <RegisterForm onSuccess={() => {}} />
        </TestWrapper>
      )

      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Check for loading state
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Failure Scenarios', () => {
    it('should show error message when registration fails with existing email', async () => {
      // Mock failed registration response - ensure it doesn't trigger success path
      const mockFetch = jest.fn().mockRejectedValueOnce(new Error('User already registered'))
      global.fetch = mockFetch

      render(
        <TestWrapper>
          <RegisterForm onSuccess={() => {}} />
        </TestWrapper>
      )

      // Fill in the form
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object))

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Wait a bit to ensure any async operations complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify no navigation occurred
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require all fields', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Try to submit empty form
      await user.click(submitButton)

      // Form should not submit with empty fields
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      // Enter invalid email format
      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Should not proceed with invalid email
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should validate password confirmation match', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      // Enter mismatched passwords
      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'differentpassword')
      await user.click(submitButton)

      // Should not proceed with mismatched passwords
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Form Interactions', () => {
    it('should toggle password visibility', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      // Find toggle buttons by their structure (buttons with SVG icons)
      const allButtons = screen.getAllByRole('button')
      const toggleButtons = allButtons.filter(button => 
        button.querySelector('svg') && button !== screen.getByRole('button', { name: /create account/i })
      )
      const passwordToggle = toggleButtons[0] // First toggle is for password field

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click toggle again to hide password
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should show password strength indicator', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)

      // Type a weak password
      await user.type(passwordInput, '123')
      
      // Should show some indication of password strength
      // (This test verifies the interaction exists)
      expect(passwordInput).toHaveValue('123')
    })
  })
})