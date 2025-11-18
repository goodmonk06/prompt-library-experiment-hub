import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Unified error handler for Fastify
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error for debugging
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      statusCode: 400,
    };
    return reply.status(400).send(response);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A record with this value already exists',
          details: { field: error.meta?.target },
          statusCode: 409,
        });

      case 'P2025': // Record not found
        return reply.status(404).send({
          error: 'Not Found',
          message: 'The requested resource was not found',
          statusCode: 404,
        });

      case 'P2003': // Foreign key constraint violation
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid reference to related resource',
          details: { field: error.meta?.field_name },
          statusCode: 400,
        });

      default:
        return reply.status(500).send({
          error: 'Database Error',
          message: 'A database error occurred',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          statusCode: 500,
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid data provided',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 400,
    });
  }

  // Fastify errors (including HTTP errors)
  if ('statusCode' in error && error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Default internal server error
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred',
    statusCode: 500,
  });
}

/**
 * Custom error classes
 */
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}
