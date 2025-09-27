// Validation middleware for API requests
// Provides Zod-based request validation with proper error handling

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Validation middleware factory that creates middleware for validating requests
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body against the schema
      const validatedData = schema.parse(req.body)
      
      // Replace the request body with validated data
      req.body = validatedData
      
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      
      // Handle other validation errors
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      })
    }
  }
}

/**
 * Validation middleware for query parameters
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query)
      req.query = validatedQuery
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      })
    }
  }
}

/**
 * Validation middleware for URL parameters
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params)
      req.params = validatedParams
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid URL parameters',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      })
    }
  }
}

export default validateRequest
