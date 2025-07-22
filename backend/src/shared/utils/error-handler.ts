import { HttpResponseInit } from "@azure/functions";

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}

export function handleError(error: any): HttpResponseInit {
  let statusCode = 500;
  let errorMessage = "An internal server error occurred";
  let errorCode = "INTERNAL_ERROR";

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    errorMessage = error.message || "Validation failed";
    errorCode = "VALIDATION_ERROR";
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
    errorMessage = "Authentication required";
    errorCode = "UNAUTHORIZED";
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
    errorMessage = "Access denied";
    errorCode = "FORBIDDEN";
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
    errorMessage = error.message || "Resource not found";
    errorCode = "NOT_FOUND";
  } else if (error.message && error.message.includes("Document Intelligence")) {
    statusCode = 503;
    errorMessage = "Document analysis service temporarily unavailable";
    errorCode = "SERVICE_UNAVAILABLE";
  }

  const errorResponse: ErrorResponse = {
    error: errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString()
  };

  return {
    status: statusCode,
    jsonBody: errorResponse
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message || "Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message?: string) {
    super(message || "Forbidden");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}