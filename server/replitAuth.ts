import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      dbUser?: any;
    }
  }
}
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    name: `${claims["first_name"] || ""} ${claims["last_name"] || ""}`.trim() || claims["email"] || "Unknown User",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Import and register enhanced auth routes
  const { registerAuthRoutes } = await import("./routes/auth.routes");
  registerAuthRoutes(app);

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const role = req.query.role as string;
    // Store role in session for use after authentication
    if (role && ["player", "operator", "admin"].includes(role)) {
      (req.session as any).intendedRole = role;
    }
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successRedirect: "/api/auth/oauth-complete",
      failureRedirect: "/api/login",
    })(req, res, (err: any) => {
      if (err) {
        return res.status(500).send(`OAuth Error: ${err.message}`);
      }
      next();
    });
  });

  app.get("/api/auth/oauth-complete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect("/login");
      }

      const user = req.user as any;
      const dbUser = await storage.getUser(user.claims.sub);

      // If user has a global role, redirect to home
      if (dbUser?.globalRole && dbUser.globalRole !== "PLAYER") {
        return res.redirect("/");
      }

      // If player with profile, redirect to home
      if (dbUser?.globalRole === "PLAYER") {
        const player = await storage.getPlayerByUserId(dbUser.id);
        if (player) {
          return res.redirect("/");
        }
      }

      // New user or incomplete profile - redirect to role selection
      res.redirect("/select-role");
    } catch (error) {
      res.redirect("/login");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.authType === "password") {
    return next();
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const requireOwner: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userId = user.claims?.sub || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || dbUser.globalRole !== "OWNER") {
      return res.status(403).json({ message: "Owner access required" });
    }
    req.dbUser = dbUser;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export const requireStaffOrOwner: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userId = user.claims?.sub || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !["STAFF", "OWNER"].includes(dbUser.globalRole || "")) {
      return res.status(403).json({ message: "Staff or Owner access required" });
    }
    req.dbUser = dbUser;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};