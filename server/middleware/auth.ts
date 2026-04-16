import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { createOwnerSchema, createOperatorSchema, createPlayerSchema, loginSchema } from "@shared/schema";
import type { GlobalRole } from "@shared/schema";

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2FA utilities
export function generateTwoFactorSecret(): string {
  return speakeasy.generateSecret({ name: "Action Ladder" }).base32;
}

export function verifyTwoFactor(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // Allow 1 step before/after for clock drift
  });
}

// Role-based middleware
export const requireRole = (allowedRoles: GlobalRole[]): RequestHandler => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as any;
      let dbUser;

      if (user.claims?.sub) {
        dbUser = await storage.getUser(user.claims.sub);
      } else if (user.id) {
        dbUser = await storage.getUser(user.id);
      }

      if (!dbUser) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (dbUser.accountStatus === "banned") {
        req.logout(() => {});
        return res.status(403).json({
          message: "Your account has been banned.",
          accountBanned: true,
          banReason: dbUser.banReason || "No reason provided.",
        });
      }

      if (dbUser.accountStatus === "suspended") {
        if (dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) < new Date()) {
          await storage.updateUser(dbUser.id, {
            accountStatus: "active",
            banReason: null,
            bannedAt: null,
            bannedBy: null,
            banExpiresAt: null,
          });
        } else {
          req.logout(() => {});
          return res.status(403).json({
            message: "Your account is suspended.",
            accountSuspended: true,
            banReason: dbUser.banReason || "No reason provided.",
            banExpiresAt: dbUser.banExpiresAt,
          });
        }
      }

      if (!allowedRoles.includes(dbUser.globalRole as GlobalRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      req.dbUser = dbUser;
      return next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

export const requireOwner = requireRole(["OWNER"]);
export const requireStaffOrOwner = requireRole(["STAFF", "OWNER"]);
export const requireOperator = requireRole(["OPERATOR"]);
export const requireAnyAuth = requireRole(["OWNER", "STAFF", "OPERATOR", "PLAYER"]);

// Account status check middleware — runs AFTER isAuthenticated
export const checkAccountStatus: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as any;
    if (!user) return next();

    const userId = user.claims?.sub || user.id;
    if (!userId) return next();

    const dbUser = await storage.getUser(userId);
    if (!dbUser) return next();

    if (dbUser.accountStatus === "banned") {
      req.logout(() => {});
      return res.status(403).json({
        message: "Your account has been banned.",
        accountBanned: true,
        banReason: dbUser.banReason || "No reason provided.",
      });
    }

    if (dbUser.accountStatus === "suspended") {
      if (dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) < new Date()) {
        await storage.updateUser(dbUser.id, {
          accountStatus: "active",
          banReason: null,
          bannedAt: null,
          bannedBy: null,
          banExpiresAt: null,
        });
        return next();
      }

      req.logout(() => {});
      return res.status(403).json({
        message: "Your account is suspended.",
        accountSuspended: true,
        banReason: dbUser.banReason || "No reason provided.",
        banExpiresAt: dbUser.banExpiresAt,
      });
    }

    return next();
  } catch (error) {
    return next();
  }
};

// Account lockout utilities
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function checkAccountLockout(email: string): Promise<boolean> {
  const user = await storage.getUserByEmail(email);
  if (!user) return false;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return true; // Account is locked
  }

  return false;
}

export async function incrementLoginAttempts(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  const attempts = (user.loginAttempts || 0) + 1;
  const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION) : undefined;

  await storage.updateUser(user.id, {
    loginAttempts: attempts,
    lockedUntil: lockUntil,
  });
}

export async function resetLoginAttempts(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  await storage.updateUser(user.id, {
    loginAttempts: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date(),
  });
}

// Session management for password auth
export function createUserSession(user: any): any {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    globalRole: user.globalRole,
    authType: "password",
  };
}