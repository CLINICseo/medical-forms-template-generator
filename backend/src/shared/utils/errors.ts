/**
 * Custom error classes for the Medical Forms Template Generator
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Storage
  STORAGE_ERROR = 'STORAGE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  
  // Document Intelligence
  DOCUMENT_ANALYSIS_FAILED = 'DOCUMENT_ANALYSIS_FAILED',
  UNSUPPORTED_DOCUMENT_TYPE = 'UNSUPPORTED_DOCUMENT_TYPE',
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // External Service
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Base custom error class
 */
export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.ENTITY_NOT_FOUND, message, 404);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends BaseError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DUPLICATE_ENTITY, message, 409, details);
  }
}

/**
 * Business Rule Error - 422
 */
export class BusinessRuleError extends BaseError {
  constructor(message: string, details?: any) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, 422, details);
  }
}

/**
 * External Service Error - 502
 */
export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string, details?: any) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error (${service}): ${message}`,
      502,
      details
    );
  }
}

/**
 * Service Unavailable Error - 503
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }
}

/**
 * Storage Error
 */
export class StorageError extends BaseError {
  constructor(operation: string, message: string, details?: any) {
    super(
      ErrorCode.STORAGE_ERROR,
      `Storage operation '${operation}' failed: ${message}`,
      500,
      details
    );
  }
}

/**
 * Document Analysis Error
 */
export class DocumentAnalysisError extends BaseError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DOCUMENT_ANALYSIS_FAILED, message, 422, details);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends BaseError {
  constructor(operation: string, message: string, details?: any) {
    super(
      ErrorCode.DATABASE_ERROR,
      `Database operation '${operation}' failed: ${message}`,
      500,
      details,
      false // Database errors are not operational
    );
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  /**
   * Check if error is operational (expected) vs programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Convert any error to BaseError
   */
  static toBaseError(error: any): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    if (error instanceof Error) {
      return new BaseError(
        ErrorCode.INTERNAL_ERROR,
        error.message,
        500,
        { originalError: error.name },
        false
      );
    }

    return new BaseError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      500,
      { originalError: String(error) },
      false
    );
  }

  /**
   * Format error for HTTP response
   */
  static formatHttpError(error: BaseError, includeStack: boolean = false): any {
    const response: any = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      }
    };

    if (error.details) {
      response.error.details = error.details;
    }

    if (includeStack && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  /**
   * Log error with appropriate severity
   */
  static logError(error: BaseError, context?: any): void {
    const errorInfo = {
      ...error.toJSON(),
      context,
      environment: process.env.NODE_ENV || 'development'
    };

    if (error.isOperational) {
      console.warn('[OPERATIONAL ERROR]', errorInfo);
    } else {
      console.error('[PROGRAMMING ERROR]', errorInfo);
    }
  }
}