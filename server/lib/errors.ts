/**
 * errors.ts — Typed error classes and error codes for the API.
 *
 * All errors extend AppError, which carries:
 *   - statusCode  → HTTP status
 *   - code        → machine-readable error code (use in API responses)
 *   - message     → human-readable description
 *   - details     → optional structured context
 *
 * Usage:
 *   throw new NotFoundError("Player not found", { playerId });
 *   throw new ForbiddenError("Insufficient role", { required: "ADMIN", actual: "PLAYER" });
 */

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Operational errors are expected; programming errors are not
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 4xx Client Errors ───────────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions", details?: Record<string, unknown>) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, "CONFLICT", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests — please slow down") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

// ─── 5xx Server Errors ───────────────────────────────────────────────────────

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred", details?: Record<string, unknown>) {
    super(message, 500, "INTERNAL_ERROR", details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is temporarily unavailable`, 503, "SERVICE_UNAVAILABLE", { service });
  }
}

// ─── Domain Errors ────────────────────────────────────────────────────────────

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 402, "PAYMENT_REQUIRED", details);
  }
}

export class MatchStateError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, "INVALID_MATCH_STATE", details);
  }
}

export class ChallengeError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, "INVALID_CHALLENGE", details);
  }
}

// ─── Type guards ─────────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isOperationalError(err: unknown): boolean {
  if (isAppError(err)) return err.isOperational;
  return false;
}
