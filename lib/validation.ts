/**
 * @fileoverview Validation utilities for database integrity
 */

// Simple UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validatePollData(data: any): void {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Poll title is required')
  }
  
  if (data.title.length < 3) {
    throw new Error('Poll title must be at least 3 characters')
  }
  
  if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
    throw new Error('Poll must have at least 2 options')
  }
  
  if (!data.expires_at) {
    throw new Error('Poll expiration date is required')
  }
  
  const expirationDate = new Date(data.expires_at)
  if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
    throw new Error('Poll expiration date must be in the future')
  }
}

export function validateVoteData(data: any): void {
  if (!data.poll_id || typeof data.poll_id !== 'string') {
    throw new Error('Poll ID is required')
  }
  
  if (!data.option_id || typeof data.option_id !== 'string') {
    throw new Error('Option ID is required')
  }
  
  if (!data.user_id || typeof data.user_id !== 'string') {
    throw new Error('User ID is required')
  }
  
  // Only validate UUID format for actual UUIDs
  if (data.poll_id.includes('-') && !UUID_REGEX.test(data.poll_id)) {
    throw new Error('Invalid UUID format')
  }
  
  if (data.option_id.includes('-') && !UUID_REGEX.test(data.option_id)) {
    throw new Error('Invalid UUID format')
  }
}

export function validateUserData(data: any): void {
  if (!data.email || typeof data.email !== 'string') {
    throw new Error('Email is required')
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format')
  }
  
  if (!data.password || typeof data.password !== 'string') {
    throw new Error('Password is required')
  }
  
  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }
}