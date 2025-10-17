/**
 * @fileoverview Database Integrity Unit Tests
 * Tests database validation, constraints, and data integrity
 */

import { validatePollData, validateVoteData, validateUserData } from '@/lib/validation'
import { DatabaseError } from '@/lib/errors'

describe('Database Integrity Unit Tests', () => {
  describe('Poll Data Validation', () => {
    it('should validate correct poll data', () => {
      const validPollData = {
        title: 'What is your favorite color?',
        description: 'Choose your preferred color',
        options: ['Red', 'Blue', 'Green'],
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: 'user-123',
      }

      expect(() => validatePollData(validPollData)).not.toThrow()
    })

    it('should reject poll data with missing title', () => {
      const invalidPollData = {
        description: 'Choose your preferred color',
        options: ['Red', 'Blue'],
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: 'user-123',
      }

      expect(() => validatePollData(invalidPollData)).toThrow('Poll title is required')
    })

    it('should reject poll data with insufficient options', () => {
      const invalidPollData = {
        title: 'Test Poll',
        description: 'Test description',
        options: ['Only One Option'],
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: 'user-123',
      }

      expect(() => validatePollData(invalidPollData)).toThrow('Poll must have at least 2 options')
    })

    it('should reject poll data with past expiration date', () => {
      const invalidPollData = {
        title: 'Test Poll',
        description: 'Test description',
        options: ['Option 1', 'Option 2'],
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        created_by: 'user-123',
      }

      expect(() => validatePollData(invalidPollData)).toThrow('Poll expiration date must be in the future')
    })

    it('should reject poll data with title too short', () => {
      const invalidPollData = {
        title: 'A', // Too short
        description: 'Test description',
        options: ['Option 1', 'Option 2'],
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: 'user-123',
      }

      expect(() => validatePollData(invalidPollData)).toThrow('Poll title must be at least 3 characters')
    })
  })

  describe('Vote Data Validation', () => {
    it('should validate correct vote data', () => {
      const validVoteData = {
        poll_id: 'poll123',
        option_id: 'option456',
        user_id: 'user789',
      }

      expect(() => validateVoteData(validVoteData)).not.toThrow()
    })

    it('should reject vote data with missing poll_id', () => {
      const invalidVoteData = {
        option_id: 'option-456',
        user_id: 'user-789',
      }

      expect(() => validateVoteData(invalidVoteData)).toThrow('Poll ID is required')
    })

    it('should reject vote data with missing option_id', () => {
      const invalidVoteData = {
        poll_id: 'poll-123',
        user_id: 'user-789',
      }

      expect(() => validateVoteData(invalidVoteData)).toThrow('Option ID is required')
    })

    it('should reject vote data with missing user_id', () => {
      const invalidVoteData = {
        poll_id: 'poll-123',
        option_id: 'option-456',
      }

      expect(() => validateVoteData(invalidVoteData)).toThrow('User ID is required')
    })

    it('should reject vote data with invalid UUID format', () => {
      const invalidVoteData = {
        poll_id: 'invalid-uuid',
        option_id: 'option-456',
        user_id: 'user-789',
      }

      expect(() => validateVoteData(invalidVoteData)).toThrow('Invalid UUID format')
    })
  })

  describe('User Data Validation', () => {
    it('should validate correct user data', () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePassword123',
      }

      expect(() => validateUserData(validUserData)).not.toThrow()
    })

    it('should reject user data with invalid email', () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'securePassword123',
      }

      expect(() => validateUserData(invalidUserData)).toThrow('Invalid email format')
    })

    it('should reject user data with weak password', () => {
      const invalidUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: '123', // Too weak
      }

      expect(() => validateUserData(invalidUserData)).toThrow('Password must be at least 6 characters')
    })

    it('should reject user data with missing password', () => {
      const invalidUserData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      expect(() => validateUserData(invalidUserData)).toThrow('Password is required')
    })
  })

  describe('Database Error Handling', () => {
    it('should create DatabaseError with correct message', () => {
      const error = new DatabaseError('Connection failed')
      expect(error.message).toBe('Connection failed')
      expect(error.name).toBe('DatabaseError')
    })

    it('should handle constraint violation errors', () => {
      const constraintError = new DatabaseError('Unique constraint violation', 'UNIQUE_VIOLATION')
      expect(constraintError.code).toBe('UNIQUE_VIOLATION')
      expect(constraintError.message).toBe('Unique constraint violation')
    })

    it('should handle foreign key constraint errors', () => {
      const fkError = new DatabaseError('Foreign key constraint failed', 'FOREIGN_KEY_VIOLATION')
      expect(fkError.code).toBe('FOREIGN_KEY_VIOLATION')
      expect(fkError.message).toBe('Foreign key constraint failed')
    })
  })
})