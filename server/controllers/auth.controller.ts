import { Request, Response } from "express";
import { storage } from "../storage";
import { 
  hashPassword, 
  verifyPassword, 
  checkAccountLockout, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  createUserSession,
  generateTwoFactorSecret,
  verifyTwoFactor
} from "../middleware/auth";
import { 
  createOwnerSchema, 
  createOperatorSchema, 
  createPlayerSchema, 
  loginSchema 
} from "@shared/schema";

// Password-based login for all user types
export async function login(req: Request, res: Response) {
  try {
    const { email, password, twoFactorCode } = loginSchema.parse(req.body);
    
    // Check if account is locked
    if (await checkAccountLockout(email)) {
      return res.status(423).json({ 
        message: "Account temporarily locked due to multiple failed login attempts" 
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      await incrementLoginAttempts(email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await incrementLoginAttempts(email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.status(200).json({ requires2FA: true });
      }
      
      if (!verifyTwoFactor(twoFactorCode, user.twoFactorSecret)) {
        await incrementLoginAttempts(email);
        return res.status(401).json({ message: "Invalid two-factor code" });
      }
    }

    // Reset login attempts and create session
    await resetLoginAttempts(email);
    
    const userSession = createUserSession(user);
    req.login(userSession, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          hallName: user.hallName,
          city: user.city,
          state: user.state
        }
      });
    });
    
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Creator/Owner account creation (admin only)
export async function createOwner(req: Request, res: Response) {
  try {
    const userData = createOwnerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);
    
    // Generate 2FA secret if enabled
    let twoFactorSecret;
    if (userData.twoFactorEnabled) {
      twoFactorSecret = generateTwoFactorSecret();
    }

    // Create owner account
    const newUser = await storage.createUser({
      email: userData.email,
      name: userData.name,
      globalRole: "OWNER",
      passwordHash,
      twoFactorEnabled: userData.twoFactorEnabled,
      twoFactorSecret,
      phoneNumber: userData.phoneNumber,
      accountStatus: "active",
      onboardingComplete: true,
      profileComplete: true,
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        globalRole: newUser.globalRole,
      },
      ...(twoFactorSecret && { twoFactorSecret })
    });
    
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Operator signup (public)
export async function signupOperator(req: Request, res: Response) {
  try {
    const operatorData = createOperatorSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(operatorData.email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash the password from the signup form
    const passwordHash = await hashPassword(operatorData.password);

    // Create operator account
    const newUser = await storage.createUser({
      email: operatorData.email,
      name: operatorData.name,
      globalRole: "OPERATOR",
      passwordHash,
      hallName: operatorData.hallName,
      city: operatorData.city,
      state: operatorData.state,
      subscriptionTier: operatorData.subscriptionTier,
      accountStatus: "active", // Changed from "pending"
      onboardingComplete: false,
      profileComplete: false,
    });

    // TODO: Create Stripe subscription based on tier
    // This would integrate with Stripe API to create subscription

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        globalRole: newUser.globalRole,
        hallName: newUser.hallName,
        subscriptionTier: newUser.subscriptionTier,
      },
      message: "Account created successfully! You can now log in with your credentials."
    });
    
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Player signup (public)
export async function signupPlayer(req: Request, res: Response) {
  try {
    const playerData = createPlayerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(playerData.email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash the password from the signup form
    const passwordHash = await hashPassword(playerData.password);

    // Create player account
    const newUser = await storage.createUser({
      email: playerData.email,
      name: playerData.name,
      globalRole: "PLAYER",
      passwordHash,
      accountStatus: "active", // Changed from "pending"
      onboardingComplete: false,
      profileComplete: false,
    });

    // Create player profile
    const player = await storage.createPlayer({
      name: playerData.name,
      userId: newUser.id,
      membershipTier: playerData.membershipTier,
      isRookie: playerData.tier === "rookie",
      rookiePassActive: playerData.tier === "rookie",
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        globalRole: newUser.globalRole,
      },
      player: {
        id: player.id,
        name: player.name,
        tier: playerData.tier,
        membershipTier: player.membershipTier,
      },
      message: "Account created successfully! You can now log in with your credentials."
    });
    
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Get current authenticated user
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    let dbUser;

    // Check if user came from OIDC or password auth
    if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    } else if (user.id) {
      dbUser = await storage.getUser(user.id);
    }

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      globalRole: dbUser.globalRole,
      hallName: dbUser.hallName,
      city: dbUser.city,
      state: dbUser.state,
      subscriptionTier: dbUser.subscriptionTier,
      accountStatus: dbUser.accountStatus,
      onboardingComplete: dbUser.onboardingComplete,
    });
    
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Logout
export function logout(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
}

// Change password
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user as any;
    
    let dbUser;
    if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    } else if (user.id) {
      dbUser = await storage.getUser(user.id);
    }

    if (!dbUser || !dbUser.passwordHash) {
      return res.status(400).json({ message: "Password change not supported for this account" });
    }

    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await storage.updateUser(dbUser.id, { 
      passwordHash: newPasswordHash,
      loginAttempts: 0,
      lockedUntil: undefined 
    });

    res.json({ message: "Password changed successfully" });
    
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Alias for route naming consistency
export const createOperator = signupOperator;

export async function authMe(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    let dbUser;

    if (user?.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    } else if (user?.id) {
      dbUser = await storage.getUser(user.id);
    }

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      globalRole: dbUser.globalRole,
      hallName: dbUser.hallName,
      city: dbUser.city,
      state: dbUser.state,
      subscriptionTier: dbUser.subscriptionTier,
      accountStatus: dbUser.accountStatus,
      onboardingComplete: dbUser.onboardingComplete
    });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Replit Auth - Handle auth success callback with role-based routing
export async function authSuccess(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const session = req.session as any;
    const intendedRole = session.intendedRole || "player";
    
    // Clear the intended role from session
    delete session.intendedRole;
    
    // Update user role in database if needed
    const user = req.user as any;
    if (user?.claims?.sub) {
      try {
        let dbUser = await storage.getUser(user.claims.sub);
        if (!dbUser) {
          // Create user if doesn't exist
          dbUser = await storage.upsertUser({
            id: user.claims.sub,
            email: user.claims.email,
            name: `${user.claims.first_name || ""} ${user.claims.last_name || ""}`.trim() || user.claims.email || "Unknown User",
          });
        }
        
        // Set role based on intended role
        let globalRole: import("@shared/schema").GlobalRole = "PLAYER";
        if (intendedRole === "admin") {
          globalRole = "OWNER";
        } else if (intendedRole === "operator") {
          globalRole = "STAFF";
        }
        
        // Update user with role if different
        if (dbUser.globalRole !== globalRole) {
          await storage.updateUser(user.claims.sub, { globalRole });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
      }
    }
    
    res.json({ 
      role: intendedRole,
      success: true 
    });
  } catch (error) {
    console.error("Auth success error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// OAuth role assignment
export async function assignRole(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const { role, ...additionalData } = req.body;

    if (!["player", "operator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role === "operator") {
      // Validate operator data
      const { hallName, city, state, subscriptionTier } = additionalData;
      if (!hallName || !city || !state || !subscriptionTier) {
        return res.status(400).json({ message: "Missing required operator information" });
      }

      await storage.updateUser(dbUser.id, {
        globalRole: "OPERATOR",
        hallName,
        city,
        state,
        subscriptionTier,
        accountStatus: "active",
        onboardingComplete: false,
        profileComplete: false,
      });
    } else {
      // Player role
      const { city, state, tier, membershipTier } = additionalData;
      if (!city || !state || !tier) {
        return res.status(400).json({ message: "Missing required player information" });
      }

      await storage.updateUser(dbUser.id, {
        globalRole: "PLAYER",
        city,
        state,
        accountStatus: "active",
        onboardingComplete: false,
        profileComplete: false,
      });

      // Create player profile
      await storage.createPlayer({
        name: dbUser.name || dbUser.email,
        userId: dbUser.id,
        membershipTier: membershipTier || "none",
        isRookie: tier === "rookie",
        rookiePassActive: tier === "rookie",
      });
    }

    res.json({ success: true, message: "Role assigned successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
