/**
 * logger.ts — Structured logger for the API server.
 * Every log includes timestamp, level, requestId (when available), and context.
 *
 * Usage:
 *   import { logger } from '../lib/logger';
 *   logger.info('Player created', { playerId, userId });
 *   logger.error('Payment failed', { error, paymentIntentId });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  requestId?: string;
  [key: string]: unknown;
}

const IS_DEV = process.env.NODE_ENV !== "production";

function formatDev(entry: LogEntry): string {
  const { ts, level, msg, requestId, ...rest } = entry;
  const colors: Record<LogLevel, string> = {
    debug: "\x1b[90m", // grey
    info:  "\x1b[36m", // cyan
    warn:  "\x1b[33m", // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const reqPart = requestId ? ` [${requestId}]` : "";
  const contextPart = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
  return `${colors[level]}[${level.toUpperCase()}]${reset}${reqPart} ${msg}${contextPart}`;
}

function log(level: LogLevel, msg: string, context: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...context,
  };

  if (IS_DEV) {
    const formatted = formatDev(entry);
    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  } else {
    // In production: emit newline-delimited JSON (structured logs for cloud logging)
    process.stdout.write(JSON.stringify(entry) + "\n");
  }
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => log("debug", msg, context),
  info:  (msg: string, context?: Record<string, unknown>) => log("info", msg, context),
  warn:  (msg: string, context?: Record<string, unknown>) => log("warn", msg, context),
  error: (msg: string, context?: Record<string, unknown>) => log("error", msg, context),

  /** Create a child logger bound to a requestId (use in request handlers) */
  forRequest: (requestId: string) => ({
    debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, { requestId, ...ctx }),
    info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, { requestId, ...ctx }),
    warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, { requestId, ...ctx }),
    error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, { requestId, ...ctx }),
  }),
};

export type Logger = typeof logger;
