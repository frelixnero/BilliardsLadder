/**
 * env.ts — Validates all required environment variables at startup.
 * If anything is missing, the server fails fast with a clear message.
 * Import this BEFORE any other server code that uses process.env.
 */

interface EnvConfig {
  // App
  NODE_ENV: string;
  PORT: number;

  // Database
  DATABASE_URL: string;

  // Auth (Replit OpenID Connect)
  REPLIT_DOMAINS: string;
  REPL_ID: string;
  ISSUER_URL: string;
  SESSION_SECRET: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SMALL_PRICE_ID?: string;
  MEDIUM_PRICE_ID?: string;
  LARGE_PRICE_ID?: string;
  MEGA_PRICE_ID?: string;

  // AI
  OPENAI_API_KEY?: string;

  // Email
  SENDGRID_API_KEY?: string;
  EMAIL_FROM?: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[ENV] Missing required environment variable: ${key}\n` +
      `  → Add it to your .env file (see .env.example for the full list)\n` +
      `  → If deploying on Replit, add it in the Secrets panel`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const errors: string[] = [];

  function safe(key: string, required = true): string {
    const val = process.env[key];
    if (required && !val) {
      missing.push(key);
      return "";
    }
    return val ?? "";
  }

  const config = {
    // App
    NODE_ENV: optionalEnv("NODE_ENV", "development"),
    PORT: parseInt(optionalEnv("PORT", "5000"), 10),

    // Database
    DATABASE_URL: safe("DATABASE_URL"),

    // Auth
    REPLIT_DOMAINS: safe("REPLIT_DOMAINS"),
    REPL_ID: safe("REPL_ID"),
    ISSUER_URL: optionalEnv("ISSUER_URL", "https://replit.com/oidc"),
    SESSION_SECRET: safe("SESSION_SECRET"),

    // Stripe
    STRIPE_SECRET_KEY: safe("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: safe("STRIPE_WEBHOOK_SECRET"),
    SMALL_PRICE_ID: optionalEnv("SMALL_PRICE_ID"),
    MEDIUM_PRICE_ID: optionalEnv("MEDIUM_PRICE_ID"),
    LARGE_PRICE_ID: optionalEnv("LARGE_PRICE_ID"),
    MEGA_PRICE_ID: optionalEnv("MEGA_PRICE_ID"),

    // AI
    OPENAI_API_KEY: optionalEnv("OPENAI_API_KEY"),

    // Email
    SENDGRID_API_KEY: optionalEnv("SENDGRID_API_KEY"),
    EMAIL_FROM: optionalEnv("EMAIL_FROM", "noreply@actionladder.com"),
  };

  if (missing.length > 0) {
    console.error(
      `\n❌ [ENV] Server cannot start — missing required environment variables:\n` +
      missing.map(k => `   • ${k}`).join("\n") +
      `\n\n   → Copy .env.example to .env and fill in the values.\n` +
      `   → On Replit: add these in the Secrets panel.\n`
    );
    process.exit(1);
  }

  if (config.NODE_ENV === "production") {
    const warnings: string[] = [];
    if (!config.OPENAI_API_KEY) warnings.push("OPENAI_API_KEY (AI features disabled)");
    if (!config.SENDGRID_API_KEY) warnings.push("SENDGRID_API_KEY (email disabled)");
    if (warnings.length > 0) {
      console.warn(
        `\n⚠️  [ENV] Optional variables not set:\n` +
        warnings.map(w => `   • ${w}`).join("\n") + "\n"
      );
    }
  }

  console.log(`✅ [ENV] Environment validated (${config.NODE_ENV})`);
  return config;
}

export const env = validateEnv();
export type { EnvConfig };
