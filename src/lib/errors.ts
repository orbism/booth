// src/lib/errors.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'STORAGE_ERROR'
  | 'EMAIL_ERROR';

interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    details?: unknown;
  };
}

export function handleApiError(
  error: unknown, 
  defaultMessage = 'An unexpected error occurred'
): NextResponse<ErrorResponse> {
  console.error('API Error:', error);
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Validation error',
          details: error.errors
        } 
      },
      { status: 400 }
    );
  }
  
  // Handle Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    return NextResponse.json(
      { 
        error: {
          type: 'DATABASE_ERROR',
          message: 'Database error occurred',
          details: error.message
        } 
      },
      { status: 500 }
    );
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    // Determine error type from message
    let type: ErrorType = 'SERVER_ERROR';
    let status = 500;
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      type = 'NOT_FOUND';
      status = 404;
    } else if (error.message.includes('unauthorized') || error.message.includes('unauthenticated')) {
      type = 'AUTHENTICATION_ERROR';
      status = 401;
    } else if (error.message.includes('forbidden') || error.message.includes('not allowed')) {
      type = 'AUTHORIZATION_ERROR'; 
      status = 403;
    } else if (error.message.includes('email') || error.message.includes('smtp')) {
      type = 'EMAIL_ERROR';
    } else if (error.message.includes('storage') || error.message.includes('file')) {
      type = 'STORAGE_ERROR';
    }
    
    return NextResponse.json(
      { 
        error: {
          type,
          message: error.message || defaultMessage
        } 
      },
      { status }
    );
  }
  
  // Unknown errors
  return NextResponse.json(
    { 
      error: {
        type: 'SERVER_ERROR',
        message: defaultMessage
      } 
    },
    { status: 500 }
  );
}

export function notFoundResponse(message = 'Resource not found'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      error: {
        type: 'NOT_FOUND',
        message
      } 
    },
    { status: 404 }
  );
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      error: {
        type: 'AUTHENTICATION_ERROR',
        message
      } 
    },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      error: {
        type: 'AUTHORIZATION_ERROR',
        message
      } 
    },
    { status: 403 }
  );
}

export function validationErrorResponse(details: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Validation error',
        details
      } 
    },
    { status: 400 }
  );
}