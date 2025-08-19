// Request validation utilities using Joi
import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'
import { ResponseHelper } from './response'

// Simple validation result type
export interface ValidationResult {
  isValid: boolean
  message: string
  errors?: string[]
}

// Simple required field validation function
export function validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationResult {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field)
    }
  }
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      errors: missingFields.map(field => `${field} is required`)
    }
  }
  
  return {
    isValid: true,
    message: 'Validation passed'
  }
}

// Common validation schemas with detailed error messages
export const commonSchemas = {
  uuid: Joi.string().uuid().required().messages({
    'string.guid': 'Must be a valid UUID',
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(1).max(255).trim().required().messages({
    'string.min': 'Name must be at least 1 character long',
    'string.max': 'Name cannot exceed 255 characters',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  description: Joi.string().max(1000).trim().allow('', null).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  position: Joi.number().integer().min(0).messages({
    'number.base': 'Position must be a number',
    'number.integer': 'Position must be a whole number',
    'number.min': 'Position cannot be negative'
  }),
  dueDate: Joi.date().iso().messages({
    'date.base': 'Due date must be a valid date',
    'date.format': 'Due date must be in ISO format (YYYY-MM-DD)'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
    'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)'
  }),
  labelCreate: Joi.object({
    name: Joi.string().min(1).max(255).trim().required(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
  }),
  taskLabelParams: Joi.object({
    taskId: Joi.string().uuid().required(),
    labelId: Joi.string().uuid().required()
  }),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().max(50),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().max(255).trim()
  }
}

// Authentication schemas with detailed error messages
export const authSchemas = {
  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }).messages({
    'object.base': 'Login data must be an object',
    'object.unknown': 'Unknown field in login data: {#key}'
  }),
  
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: Joi.string().min(1).max(255).trim().messages({
      'string.min': 'Full name must be at least 1 character long',
      'string.max': 'Full name cannot exceed 255 characters',
      'string.empty': 'Full name cannot be empty when provided'
    })
  }).messages({
    'object.base': 'Registration data must be an object',
    'object.unknown': 'Unknown field in registration data: {#key}'
  })
}

// Board schemas with detailed error messages
export const boardSchemas = {
  create: Joi.object({
    name: commonSchemas.name,
    description: commonSchemas.description
  }).messages({
    'object.base': 'Board creation data must be an object',
    'object.unknown': 'Unknown field in board data: {#key}'
  }),
  
  update: Joi.object({
    name: commonSchemas.name.optional(),
    description: commonSchemas.description.optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for board update',
    'object.base': 'Board update data must be an object',
    'object.unknown': 'Unknown field in board update data: {#key}'
  }),
  
  addCollaborator: Joi.object({
    email: commonSchemas.email,
    role: Joi.string().valid('member', 'admin').default('member').messages({
      'any.only': 'Role must be either "member" or "admin"'
    })
  }).messages({
    'object.base': 'Collaborator data must be an object',
    'object.unknown': 'Unknown field in collaborator data: {#key}'
  })
}

// List schemas with detailed error messages
export const listSchemas = {
  create: Joi.object({
    name: commonSchemas.name,
    boardId: commonSchemas.uuid,
    position: commonSchemas.position.optional()
  }).messages({
    'object.base': 'List creation data must be an object',
    'object.unknown': 'Unknown field in list data: {#key}'
  }),
  
  update: Joi.object({
    name: commonSchemas.name.optional(),
    position: commonSchemas.position.optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for list update',
    'object.base': 'List update data must be an object',
    'object.unknown': 'Unknown field in list update data: {#key}'
  })
}

// Task schemas with detailed error messages
export const taskSchemas = {
  create: Joi.object({
    title: commonSchemas.name,
    description: commonSchemas.description.optional(),
    listId: commonSchemas.uuid,
    dueDate: commonSchemas.dueDate.optional(),
    position: commonSchemas.position.optional(),
    labels: Joi.array().items(
      Joi.object({
        name: commonSchemas.name,
        color: commonSchemas.color
      }).messages({
        'object.base': 'Each label must be an object',
        'object.unknown': 'Unknown field in label: {#key}'
      })
    ).optional().messages({
      'array.base': 'Labels must be an array'
    })
  }).messages({
    'object.base': 'Task creation data must be an object',
    'object.unknown': 'Unknown field in task data: {#key}'
  }),
  
  update: Joi.object({
    title: commonSchemas.name.optional(),
    description: commonSchemas.description.optional(),
    listId: commonSchemas.uuid.optional(),
    dueDate: commonSchemas.dueDate.optional().allow(null),
    position: commonSchemas.position.optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for task update',
    'object.base': 'Task update data must be an object',
    'object.unknown': 'Unknown field in task update data: {#key}'
  }),
  
  move: Joi.object({
    listId: commonSchemas.uuid,
    position: commonSchemas.position
  }).messages({
    'object.base': 'Task move data must be an object',
    'object.unknown': 'Unknown field in task move data: {#key}'
  })
}

// Parameter schemas
export const paramSchemas = {
  id: Joi.object({
    id: commonSchemas.uuid
  }),
  
  boardId: Joi.object({
    boardId: commonSchemas.uuid
  }),
  
  listId: Joi.object({
    listId: commonSchemas.uuid
  }),
  
  taskId: Joi.object({
    taskId: commonSchemas.uuid
  })
}

// Query schemas
export const querySchemas = {
  pagination: Joi.object(commonSchemas.pagination),
  
  boardFilters: Joi.object({
    ...commonSchemas.pagination,
    collaboratorId: commonSchemas.uuid.optional()
  }),
  
  taskFilters: Joi.object({
    ...commonSchemas.pagination,
    listId: commonSchemas.uuid.optional(),
    boardId: commonSchemas.uuid.optional(),
    dueDateFrom: commonSchemas.dueDate.optional(),
    dueDateTo: commonSchemas.dueDate.optional(),
    hasLabels: Joi.boolean().optional()
  })
}

// Validation middleware factory
export function validate(schema: Joi.ObjectSchema, target: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target]
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    })
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
      
      ResponseHelper.validationError(
        res,
        'Validation failed',
        { errors: validationErrors }
      )
      return
    }
    
    // Replace the original data with validated and sanitized data
    req[target] = value
    next()
  }
}

// Utility functions
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isStrongPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}