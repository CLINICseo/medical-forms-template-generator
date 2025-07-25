import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BaseError, ErrorUtils, ErrorCode } from '../utils/errors';

/**
 * Global error handler for Azure Functions
 */
export class ErrorHandler {
  /**
   * Handle errors and return appropriate HTTP response
   */
  static handleError(
    error: any,
    context: InvocationContext,
    request?: HttpRequest
  ): HttpResponseInit {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Log error with context
    const errorContext = {
      functionName: context.functionName,
      invocationId: context.invocationId,
      requestUrl: request?.url,
      requestMethod: request?.method,
      requestHeaders: request?.headers ? Object.fromEntries(request.headers.entries()) : undefined
    };
    
    ErrorUtils.logError(baseError, errorContext);
    
    // Determine if we should include stack trace
    const includeStack = process.env.NODE_ENV === 'development';
    
    // Format error response
    const errorResponse = ErrorUtils.formatHttpError(baseError, includeStack);
    
    return {
      status: baseError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Request-ID': context.invocationId
      },
      jsonBody: errorResponse
    };
  }

  /**
   * Wrap an async function with error handling
   */
  static wrapAsync<T extends (...args: any[]) => Promise<HttpResponseInit>>(
    fn: T
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        // Extract context and request from arguments
        const context = args.find(arg => arg && arg.invocationId) as InvocationContext;
        const request = args.find(arg => arg && arg.method && arg.url) as HttpRequest;
        
        return ErrorHandler.handleError(error, context, request);
      }
    }) as T;
  }

  /**
   * Create a middleware for validating required fields
   */
  static validateRequired(fields: string[]) {
    return async (request: HttpRequest): Promise<void> => {
      const body = await request.json() as any;
      const missingFields: string[] = [];
      
      for (const field of fields) {
        if (!body[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        throw new BaseError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          `Missing required fields: ${missingFields.join(', ')}`,
          400,
          { missingFields }
        );
      }
    };
  }

  /**
   * Create a middleware for validating request body against a schema
   */
  static validateSchema(schema: any) {
    return async (request: HttpRequest): Promise<void> => {
      const body = await request.json();
      
      // Simple schema validation (you can replace with Joi, Yup, etc.)
      for (const [key, validator] of Object.entries(schema)) {
        const value = (body as any)[key];
        
        if (typeof validator === 'function') {
          const isValid = validator(value);
          if (!isValid) {
            throw new BaseError(
              ErrorCode.INVALID_FORMAT,
              `Invalid format for field '${key}'`,
              400,
              { field: key, value }
            );
          }
        }
      }
    };
  }

  /**
   * Rate limiting error handler
   */
  static rateLimitExceeded(limit: number, window: string): HttpResponseInit {
    return {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Window': window,
        'Retry-After': '60'
      },
      jsonBody: {
        success: false,
        error: {
          code: ErrorCode.RESOURCE_LIMIT_EXCEEDED,
          message: `Rate limit exceeded. Maximum ${limit} requests per ${window}`,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * CORS preflight handler
   */
  static handleCors(
    allowedOrigins: string[] = ['*'],
    allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: string[] = ['Content-Type', 'Authorization']
  ): HttpResponseInit {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.join(','),
        'Access-Control-Allow-Methods': allowedMethods.join(','),
        'Access-Control-Allow-Headers': allowedHeaders.join(','),
        'Access-Control-Max-Age': '86400'
      }
    };
  }

  /**
   * Success response wrapper
   */
  static successResponse(
    data: any,
    statusCode: number = 200,
    additionalHeaders: Record<string, string> = {}
  ): HttpResponseInit {
    return {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...additionalHeaders
      },
      jsonBody: {
        success: true,
        data,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle Azure service errors
   */
  static handleAzureError(error: any, service: string): never {
    // Handle specific Azure error codes
    if (error.code === 'BlobNotFound') {
      throw new BaseError(
        ErrorCode.FILE_NOT_FOUND,
        'The requested file was not found',
        404,
        { service, originalError: error.code }
      );
    }
    
    if (error.code === 'ContainerNotFound') {
      throw new BaseError(
        ErrorCode.STORAGE_ERROR,
        'Storage container not found',
        500,
        { service, originalError: error.code }
      );
    }
    
    if (error.statusCode === 401 || error.code === 'AuthenticationFailed') {
      throw new BaseError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Authentication failed for ${service}`,
        500,
        { service, originalError: error.message }
      );
    }
    
    if (error.statusCode === 429 || error.code === 'TooManyRequests') {
      throw new BaseError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        `Rate limit exceeded for ${service}`,
        429,
        { service, retryAfter: error.retryAfter }
      );
    }
    
    // Default Azure error
    throw new BaseError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} error: ${error.message || 'Unknown error'}`,
      error.statusCode || 500,
      { service, originalError: error }
    );
  }
}