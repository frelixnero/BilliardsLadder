// ⚡ Validate all env vars at startup — fails fast with a clear message if any are missing
import "./config/env";

import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { requestIdMiddleware, errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./lib/logger";

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set('trust proxy', 1);

// Attach requestId to every request (used in error responses + logs)
app.use(requestIdMiddleware);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"], // unsafe-eval needed for Vite in dev, js.stripe.com for Stripe.js
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Stripe iframe embedding
}));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.REPLIT_DOMAINS?.split(',') || [], 'https://*.replit.app'].flat()
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Exclude webhooks from rate limiting (machine-to-machine traffic)
const isWebhookRoute = (req: express.Request) => {
  return req.path.includes('/webhook') || 
         req.path.includes('/stripe-webhook') ||
         req.headers['stripe-signature'];
};

const skipWebhooks = (limiter: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (isWebhookRoute(req)) return next();
  return limiter(req, res, next);
};

// Create persistent rate limiter instances at app initialization
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes for user payments
  message: { error: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many API requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting with webhook exclusions
app.use('/api/auth', skipWebhooks(authLimiter));
app.use('/api/payments', skipWebhooks(paymentLimiter));
app.use('/api', skipWebhooks(generalLimiter));

// Development-only API logging middleware
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });
}

(async () => {
  // Initialize revenue configuration system
  const { initializeRevenueConfig } = await import("./services/revenueConfigService");
  try {
    await initializeRevenueConfig();
    log("Revenue configuration system initialized");
  } catch (error) {
    log(`Warning: Failed to initialize revenue configuration: ${error}`);
  }

  const server = await registerRoutes(app);

  // 404 handler for /api — must be BEFORE Vite so unknown API routes
  // get a JSON 404 instead of being caught by Vite's SPA fallback
  app.use('/api', notFoundHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler — must be LAST middleware (4-arg signature required)
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // The system expects port 5000 to be opened. Use environment variable PORT which is set to 5000.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    logger.info(`Server started`, { port, env: process.env.NODE_ENV });
  });
})();
