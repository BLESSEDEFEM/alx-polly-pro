/**
 * @fileoverview Custom error classes
 * Provides specialized error types for the application
 */

export class DatabaseError extends Error {
  public code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
  }
}