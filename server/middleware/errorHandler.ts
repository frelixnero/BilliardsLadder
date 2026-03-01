/**
 * errorHandler.ts — Global Express error handling middleware.
 *
 * Returns a consistent JSON error shape for ALL errors:
 * {
 *   code:      string   — machine-readable error code
 *   message:   string   — human-readable description
 *   requestId: string   — for tracing (attach to every request via requestId middleware)
 *   details?:  object   — optional structured context (dev/staging only)
 * }
 *
 * Register LAST in server/index.ts:
 *   app.use(errorHandler);
 */

import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto"; // built-in — no extra dependency
import { isAppError } from "../lib/errors";
import { logger } from "../lib/logger";

// ─── Request ID middleware (attach before routes) ────────────────────────────
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID().slice(0, 10);
  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

// ─── Global error handler ───────────────────────────────────────────────────
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId ?? "unknown";
  const isDev = process.env.NODE_ENV !== "production";

  if (isAppError(err)) {
    // Known operational error — log at appropriate level
    const logCtx = {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      ...(err.details ?? {}),
    };

    if (err.statusCode >= 500) {
      logger.error(err.message, { ...logCtx, stack: err.stack });
    } else if (err.statusCode >= 400) {
      logger.warn(err.message, logCtx);
    }

    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      requestId,
      ...(isDev && err.details ? { details: err.details } : {}),
    });
  }

  // Unknown / programming error — log full stack
  const unknownErr = err as Error;
  logger.error("Unhandled error", {
    requestId,
    message: unknownErr?.message ?? String(err),
    stack: unknownErr?.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: isDev
      ? (unknownErr?.message ?? "Internal Server Error")
      : "An unexpected error occurred",
    requestId,
    ...(isDev && unknownErr?.stack ? { stack: unknownErr.stack.split("\n").slice(0, 5) } : {}),
  });
}

// ─── 404 Not Found handler (register after all routes, before errorHandler) ──
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api")) {
    return next();
  }
  const requestId = (req as any).requestId ?? "unknown";
  logger.warn("Route not found", { requestId, path: req.path, method: req.method });
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} does not exist`,
    requestId,
  });
}
