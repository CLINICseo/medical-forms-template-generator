/**
 * Frontend error handling utilities
 */

// eslint-disable-next-line no-unused-vars
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: Date;
  requestId?: string;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error {
  public type: ErrorType;
  public details?: any;
  public statusCode?: number;
  public timestamp: Date;
  public requestId?: string;

  constructor(
    type: ErrorType,
    message: string,
    statusCode?: number,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      requestId: this.requestId
    };
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Parse API error response
   */
  static parseApiError(error: any): ApplicationError {
    // Handle network errors
    if (error.message === 'Network Error' || !error.response) {
      return new ApplicationError(
        ErrorType.NETWORK_ERROR,
        'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
        0
      );
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return new ApplicationError(
        ErrorType.TIMEOUT_ERROR,
        'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',
        408
      );
    }

    const response = error.response;
    const statusCode = response?.status;
    const data = response?.data;

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        return new ApplicationError(
          ErrorType.VALIDATION_ERROR,
          data?.error?.message || 'Los datos proporcionados no son válidos.',
          statusCode,
          data?.error?.details
        );
      
      case 401:
        return new ApplicationError(
          ErrorType.AUTHENTICATION_ERROR,
          'No estás autenticado. Por favor, inicia sesión.',
          statusCode
        );
      
      case 403:
        return new ApplicationError(
          ErrorType.PERMISSION_ERROR,
          'No tienes permisos para realizar esta acción.',
          statusCode
        );
      
      case 404:
        return new ApplicationError(
          ErrorType.NOT_FOUND_ERROR,
          data?.error?.message || 'El recurso solicitado no fue encontrado.',
          statusCode
        );
      
      case 429:
        return new ApplicationError(
          ErrorType.API_ERROR,
          'Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente.',
          statusCode,
          { retryAfter: response.headers['retry-after'] }
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApplicationError(
          ErrorType.API_ERROR,
          'Error en el servidor. Por favor, intenta más tarde.',
          statusCode,
          data?.error
        );
      
      default:
        return new ApplicationError(
          ErrorType.API_ERROR,
          data?.error?.message || 'Ocurrió un error inesperado.',
          statusCode,
          data?.error
        );
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApplicationError | Error): string {
    if (error instanceof ApplicationError) {
      return error.message;
    }
    
    // Generic error messages for non-application errors
    return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
  }

  /**
   * Log error to console (in development) or error tracking service
   */
  static logError(error: Error | ApplicationError, context?: any): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      ...(error instanceof ApplicationError ? {
        type: error.type,
        statusCode: error.statusCode,
        details: error.details,
        requestId: error.requestId
      } : {})
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', errorInfo);
    } else {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      console.error('Error occurred:', errorInfo.message);
    }
  }

  /**
   * Handle file upload errors specifically
   */
  static handleUploadError(error: any): ApplicationError {
    const fileError = this.parseApiError(error);
    
    // Add specific file upload error handling
    if (error.message?.includes('File too large')) {
      return new ApplicationError(
        ErrorType.VALIDATION_ERROR,
        'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.',
        413
      );
    }
    
    if (error.message?.includes('Invalid file type')) {
      return new ApplicationError(
        ErrorType.VALIDATION_ERROR,
        'Tipo de archivo no válido. Solo se permiten archivos PDF.',
        415
      );
    }
    
    return fileError;
  }

  /**
   * Create an error boundary error handler
   */
  static createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      ErrorHandler.logError(error, {
        component: componentName,
        errorInfo
      });
    };
  }

  /**
   * Retry logic for failed requests
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof ApplicationError && 
            error.statusCode && 
            error.statusCode >= 400 && 
            error.statusCode < 500) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
        }
      }
    }
    
    // eslint-disable-next-line no-throw-literal
    throw lastError!;
  }
}