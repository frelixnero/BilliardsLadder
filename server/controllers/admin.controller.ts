import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import type { User, InsertUser } from "../storage";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : (null as unknown as Stripe);

// Invite a trusted friend to receive payouts
export async function inviteStaff(req: Request, res: Response) {
  try {
    const { email, name, shareBps } = req.body;

    if (!email || !shareBps) {
      return res.status(400).json({ error: "Email and shareBps are required" });
    }

    // 1) Create/find User
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({
        email,
        name,
        globalRole: "STAFF",
        payoutShareBps: Number(shareBps),
        onboardingComplete: false
      });
    } else if (user.globalRole === "PLAYER") {
      user = await storage.updateUser(user.id, { 
        globalRole: "STAFF",
        payoutShareBps: Number(shareBps)
      });
    }

    // 2) Create a Connect Express account if not exists
    if (!user.stripeConnectId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email,
        business_type: "individual"
      });
      
      user = await storage.updateUser(user.id, {
        stripeConnectId: account.id,
        payoutShareBps: Number(shareBps)
      });
    } else {
      // Update share if provided
      if (shareBps != null) {
        await storage.updateUser(user.id, { payoutShareBps: Number(shareBps) });
      }
    }

    // 3) Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeConnectId,
      refresh_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/admin/staff/onboarding-refresh`,
      return_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/admin/staff/onboarding-done`,
      type: "account_onboarding"
    });

    return res.json({ 
      onboardingUrl: accountLink.url, 
      staffUserId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        payoutShareBps: user.payoutShareBps,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (error: any) {
    console.error("Staff invite error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Update a friend's payout percentage
export async function updateStaffShare(req: Request, res: Response) {
  try {
    const { userId, shareBps } = req.body;
    
    if (!userId || shareBps == null) {
      return res.status(400).json({ error: "userId and shareBps are required" });
    }

    const user = await storage.updateUser(userId, { 
      payoutShareBps: Number(shareBps) 
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ ok: true, user });
  } catch (error: any) {
    console.error("Update staff share error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get all staff members
export async function getAllStaff(req: Request, res: Response) {
  try {
    const staff = await storage.getStaffUsers();
    return res.json({ staff });
  } catch (error: any) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get payout history
export async function getPayouts(req: Request, res: Response) {
  try {
    const transfers = await storage.getAllPayoutTransfers();
    
    // Enhance with user details
    const enhancedTransfers = await Promise.all(
      transfers.map(async (transfer: any) => {
        const user = await storage.getUser(transfer.recipientUserId);
        return {
          ...transfer,
          recipientName: user?.name || user?.email || "Unknown",
          recipientEmail: user?.email
        };
      })
    );

    return res.json({ transfers: enhancedTransfers });
  } catch (error: any) {
    console.error("Get payouts error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Check Connect account status
export async function getConnectStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    
    if (!user?.stripeConnectId) {
      return res.json({ status: "not_connected" });
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectId);
    
    return res.json({
      status: "connected",
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements
    });
  } catch (error: any) {
    console.error("Connect status error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Update subscription seat quantity
export async function updateOrgSeats(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Valid quantity required (minimum 1)" });
    }

    const org = await storage.getOrganization(orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!org.stripeSubscriptionId) {
      return res.status(400).json({ error: "Organization has no active subscription" });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    if (!subscription || subscription.items.data.length === 0) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    // Update the first subscription item with new quantity
    const subscriptionItem = subscription.items.data[0];
    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{
        id: subscriptionItem.id,
        quantity: Number(quantity)
      }],
      proration_behavior: 'create_prorations'
    });

    // Update organization seat limit
    const updatedOrg = await storage.updateOrganization(orgId, {
      seatLimit: Number(quantity)
    });

    return res.json({
      success: true,
      organization: updatedOrg,
      newQuantity: Number(quantity),
      message: `Subscription updated to ${quantity} seats`
    });

  } catch (error: any) {
    console.error("Seat update error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get organization subscription details
export async function getOrgSubscription(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const org = await storage.getOrganization(orgId);
    
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!org.stripeSubscriptionId) {
      return res.json({ 
        status: "no_subscription",
        organization: org 
      });
    }

    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId, {
      expand: ['latest_invoice', 'items.data.price']
    });

    return res.json({
      status: "active",
      organization: org,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end || 0,
        quantity: subscription.items.data[0]?.quantity || 1,
        priceId: subscription.items.data[0]?.price?.id,
        amount: subscription.items.data[0]?.price?.unit_amount,
        currency: subscription.items.data[0]?.price?.currency,
        interval: subscription.items.data[0]?.price?.recurring?.interval
      }
    });

  } catch (error: any) {
    console.error("Subscription details error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get all organizations
export async function getAllOrganizations(req: Request, res: Response) {
  try {
    const organizations = await storage.getAllOrganizations();
    return res.json({ organizations });
  } catch (error: any) {
    console.error("Get organizations error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Auto-split money after each invoice (webhook handler)
export async function payStaffFromInvoice(invoice: any) {
  try {
    // 1) Total invoice amount in cents
    const grossAmount = invoice.total;
    
    console.log(`Processing payout split for invoice ${invoice.id}: $${grossAmount / 100}`);

    // 2) Get all staff with Connect IDs and payout shares
    const staff = await storage.getStaffUsers();
    const eligibleStaff = staff.filter(s => 
      s.stripeConnectId && 
      s.payoutShareBps && 
      s.payoutShareBps > 0 &&
      s.onboardingComplete
    );

    if (eligibleStaff.length === 0) {
      console.log("No eligible staff for payouts");
      return;
    }

    // 3) Calculate total basis points and validate 
    const totalBps = eligibleStaff.reduce((sum, s) => sum + (s.payoutShareBps || 0), 0);
    console.log(`Total payout allocation: ${totalBps / 100}% across ${eligibleStaff.length} recipients`);

    // 4) Create transfers for each staff member
    for (const staffMember of eligibleStaff) {
      const shareAmount = Math.floor((grossAmount * (staffMember.payoutShareBps || 0)) / 10000);
      
      if (shareAmount > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: shareAmount,
            currency: "usd",
            destination: staffMember.stripeConnectId!,
            transfer_group: invoice.id,
            description: `Revenue share: ${(staffMember.payoutShareBps || 0) / 100}% of invoice ${invoice.id}`
          });

          // Record the transfer in our database
          await storage.createPayoutTransfer({
            invoiceId: invoice.id,
            stripeTransferId: transfer.id,
            recipientUserId: staffMember.id,
            amount: shareAmount,
            shareType: staffMember.globalRole
          });

          console.log(`✅ Paid ${staffMember.name || staffMember.email}: $${shareAmount / 100} (${(staffMember.payoutShareBps || 0) / 100}%)`);
        } catch (transferError: any) {
          console.error(`❌ Transfer failed for ${staffMember.email}:`, transferError.message);
        }
      }
    }

  } catch (error: any) {
    console.error("Payout processing error:", error);
    throw error;
  }
}

// ===== OPERATOR ROUTES =====

// Get all operator settings (for trustee view)
export async function getAllOperators(req: Request, res: Response) {
  try {
    const operators = await storage.getAllOperatorSettings();
    // Get user details for each operator
    const operatorsWithDetails = await Promise.all(
      operators.map(async (settings: any) => {
        const user = await storage.getUser(settings.operatorUserId);
        return {
          ...settings,
          user: user ? { name: user.name, email: user.email } : null
        };
      })
    );
    res.json(operatorsWithDetails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Toggle free months for an operator (trustee only)
export async function toggleFreeMonths(req: Request, res: Response) {
  try {
    const { operatorUserId } = req.params;
    const { hasFreeMonths, freeMonthsCount } = req.body;
    const trusteeId = (req.user as any)?.id;

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create default settings first
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: "Your City",
        areaName: "Your Area",
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    }

    const updated = await storage.updateOperatorSettings(operatorUserId, {
      hasFreeMonths,
      freeMonthsCount: hasFreeMonths ? freeMonthsCount || 1 : 0,
      freeMonthsGrantedBy: hasFreeMonths ? trusteeId : null,
      freeMonthsGrantedAt: hasFreeMonths ? new Date() : null,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get operator's own settings
export async function checkOperatorSettingsComplete(req: Request, res: Response) {
  try {
    const operatorUserId = req.query.userId as string;
    if (!operatorUserId) {
      return res.json({ complete: false });
    }

    const settings = await storage.getOperatorSettings(operatorUserId);
    const hasSettings = !!settings;
    const hasRealValues = !!(
      settings &&
      settings.cityName &&
      settings.cityName !== "Your City" &&
      settings.areaName &&
      settings.areaName !== "Your Area"
    );
    const complete = hasRealValues || hasSettings;

    res.json({ complete });
  } catch (error: any) {
    res.json({ complete: false });
  }
}

export async function getOperatorSettings(req: Request, res: Response) {
  try {
    // In a real app, this would get the current user from session
    // For demo, we'll use a query parameter
    const operatorUserId = req.query.userId as string;
    if (!operatorUserId) {
      return res.status(400).json({ error: "operatorUserId required" });
    }

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create default settings for new operator
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: "Your City",
        areaName: "Your Area",
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Update operator's customization settings
export async function updateOperatorSettings(req: Request, res: Response) {
  try {
    const operatorUserId = req.query.userId as string;
    if (!operatorUserId) {
      return res.status(400).json({ error: "operatorUserId required" });
    }

    const { cityName, areaName, customBranding } = req.body;

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create if doesn't exist
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: cityName || "Your City",
        areaName: areaName || "Your Area",
        customBranding,
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    } else {
      // Update existing
      settings = await storage.updateOperatorSettings(operatorUserId, {
        cityName,
        areaName,
        customBranding,
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get organization seats
export async function getOrganizationSeats(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub || user.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user's organization
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !dbUser.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }

    const org = await storage.getOrganization(dbUser.organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({
      seatLimit: org.seatLimit,
      seatsUsed: (org as any).seatsUsed || 0,
      seatsAvailable: (org.seatLimit || 0) - ((org as any).seatsUsed || 0)
    });
  } catch (error: any) {
    console.error("Get organization seats error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Ban a user (permanent)
export async function banUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUser = (req as any).dbUser;

    if (!reason) {
      return res.status(400).json({ error: "A ban reason is required" });
    }

    const targetUser = await storage.getUser(id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.globalRole === "OWNER") {
      return res.status(403).json({ error: "Cannot ban an owner account" });
    }

    if (targetUser.accountStatus === "banned") {
      return res.status(400).json({ error: "User is already banned" });
    }

    await storage.updateUser(id, {
      accountStatus: "banned",
      banReason: reason,
      bannedAt: new Date(),
      bannedBy: adminUser.id,
      banExpiresAt: null,
    });

    try {
      const { emailService } = await import("../services/email-service");
      await emailService.sendEmail({
        to: targetUser.email,
        subject: "BilliardsLadder - Account Banned",
        html: generateBanEmailHtml(targetUser.name || targetUser.email, reason, null),
      });
    } catch (emailErr) {
      console.error("[BanSystem] Failed to send ban notification email:", emailErr);
    }

    return res.json({ message: "User has been banned", userId: id });
  } catch (error: any) {
    console.error("Ban user error:", error);
    return res.status(500).json({ error: "Failed to ban user" });
  }
}

// Suspend a user (temporary)
export async function suspendUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason, expiresAt } = req.body;
    const adminUser = (req as any).dbUser;

    if (!reason) {
      return res.status(400).json({ error: "A suspension reason is required" });
    }

    if (!expiresAt) {
      return res.status(400).json({ error: "An expiry date is required for suspensions" });
    }

    const expiryDate = new Date(expiresAt);
    if (expiryDate <= new Date()) {
      return res.status(400).json({ error: "Expiry date must be in the future" });
    }

    const targetUser = await storage.getUser(id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.globalRole === "OWNER") {
      return res.status(403).json({ error: "Cannot suspend an owner account" });
    }

    await storage.updateUser(id, {
      accountStatus: "suspended",
      banReason: reason,
      bannedAt: new Date(),
      bannedBy: adminUser.id,
      banExpiresAt: expiryDate,
    });

    try {
      const { emailService } = await import("../services/email-service");
      await emailService.sendEmail({
        to: targetUser.email,
        subject: "BilliardsLadder - Account Suspended",
        html: generateBanEmailHtml(targetUser.name || targetUser.email, reason, expiryDate),
      });
    } catch (emailErr) {
      console.error("[BanSystem] Failed to send suspension notification email:", emailErr);
    }

    return res.json({ message: "User has been suspended", userId: id, expiresAt: expiryDate });
  } catch (error: any) {
    console.error("Suspend user error:", error);
    return res.status(500).json({ error: "Failed to suspend user" });
  }
}

// Unban/unsuspend a user
export async function unbanUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const targetUser = await storage.getUser(id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.accountStatus !== "banned" && targetUser.accountStatus !== "suspended") {
      return res.status(400).json({ error: "User is not banned or suspended" });
    }

    await storage.updateUser(id, {
      accountStatus: "active",
      banReason: null,
      bannedAt: null,
      bannedBy: null,
      banExpiresAt: null,
    });

    try {
      const { emailService } = await import("../services/email-service");
      await emailService.sendEmail({
        to: targetUser.email,
        subject: "BilliardsLadder - Account Reinstated",
        html: generateUnbanEmailHtml(targetUser.name || targetUser.email),
      });
    } catch (emailErr) {
      console.error("[BanSystem] Failed to send unban notification email:", emailErr);
    }

    return res.json({ message: "User has been reinstated", userId: id });
  } catch (error: any) {
    console.error("Unban user error:", error);
    return res.status(500).json({ error: "Failed to reinstate user" });
  }
}

// Get all banned/suspended users
export async function getBannedUsers(req: Request, res: Response) {
  try {
    const allUsers = await storage.getAllUsers();
    const bannedUsers = allUsers.filter(
      (u: any) => u.accountStatus === "banned" || u.accountStatus === "suspended"
    ).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      globalRole: u.globalRole,
      accountStatus: u.accountStatus,
      banReason: u.banReason,
      bannedAt: u.bannedAt,
      bannedBy: u.bannedBy,
      banExpiresAt: u.banExpiresAt,
    }));

    return res.json(bannedUsers);
  } catch (error: any) {
    console.error("Get banned users error:", error);
    return res.status(500).json({ error: "Failed to fetch banned users" });
  }
}

// Get all users for admin management
export async function getAllUsersAdmin(req: Request, res: Response) {
  try {
    const allUsers = await storage.getAllUsers();
    const users = allUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      globalRole: u.globalRole,
      accountStatus: u.accountStatus,
      banReason: u.banReason,
      bannedAt: u.bannedAt,
      banExpiresAt: u.banExpiresAt,
      createdAt: u.createdAt,
    }));

    return res.json(users);
  } catch (error: any) {
    console.error("Get all users error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}

function generateBanEmailHtml(userName: string, reason: string, expiresAt: Date | null): string {
  const isSuspension = expiresAt !== null;
  const title = isSuspension ? "Account Suspended" : "Account Banned";
  const expiryText = expiresAt
    ? `<p style="color:#cccccc;font-size:16px;">Your suspension will be lifted on <strong style="color:#f59e0b;">${expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.</p>`
    : `<p style="color:#cccccc;font-size:16px;">This ban is permanent. If you believe this was a mistake, please contact support.</p>`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Courier New',monospace;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#111111;">
        <div style="text-align:center;padding:30px 0;border-bottom:2px solid #ef4444;margin-bottom:30px;">
          <div style="font-size:32px;font-weight:bold;color:#ef4444;margin-bottom:10px;">BILLIARDS LADDER</div>
          <div style="color:#888888;font-size:14px;font-style:italic;">In here, respect is earned in racks, not words</div>
        </div>
        <div style="padding:20px 0;">
          <h2 style="color:#ef4444;margin-bottom:20px;">${title}</h2>
          <p style="color:#cccccc;font-size:16px;">Hello ${userName},</p>
          <p style="color:#cccccc;font-size:16px;">Your BilliardsLadder account has been ${isSuspension ? "suspended" : "banned"}.</p>
          <div style="background:#1a0000;border:1px solid #ef4444;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:#ef4444;font-weight:bold;margin:0 0 8px 0;">Reason:</p>
            <p style="color:#cccccc;margin:0;">${reason}</p>
          </div>
          ${expiryText}
        </div>
        <div style="background:#0a0a0a;color:#555555;padding:20px;text-align:center;font-size:12px;border-top:1px solid #222222;">
          <p style="margin:0;">BilliardsLadder &mdash; Pool &bull; Points &bull; Pride</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateUnbanEmailHtml(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Courier New',monospace;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#111111;">
        <div style="text-align:center;padding:30px 0;border-bottom:2px solid #00ff00;margin-bottom:30px;">
          <div style="font-size:32px;font-weight:bold;color:#00ff00;margin-bottom:10px;">BILLIARDS LADDER</div>
          <div style="color:#888888;font-size:14px;font-style:italic;">In here, respect is earned in racks, not words</div>
        </div>
        <div style="padding:20px 0;">
          <h2 style="color:#00ff00;margin-bottom:20px;">Account Reinstated</h2>
          <p style="color:#cccccc;font-size:16px;">Hello ${userName},</p>
          <p style="color:#cccccc;font-size:16px;">Your BilliardsLadder account has been reinstated. You can now log in and access all features.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.APP_BASE_URL || 'http://localhost:5000'}/login"
               style="background:#059669;color:white;padding:14px 40px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:16px;letter-spacing:1px;">
              LOG IN NOW
            </a>
          </div>
        </div>
        <div style="background:#0a0a0a;color:#555555;padding:20px;text-align:center;font-size:12px;border-top:1px solid #222222;">
          <p style="margin:0;">BilliardsLadder &mdash; Pool &bull; Points &bull; Pride</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ===== BAN APPEAL SYSTEM =====

export async function submitAppeal(req: Request, res: Response) {
  try {
    const { appealToken, reason, supportingContext } = req.body;

    if (!appealToken || !reason) {
      return res.status(400).json({ error: "appealToken and reason are required" });
    }

    const { verifyAppealToken } = await import("./auth.controller");
    const tokenResult = verifyAppealToken(appealToken);
    if (!tokenResult.valid || !tokenResult.userId) {
      return res.status(403).json({ error: "Invalid or expired appeal token. Please log in again to get a new token." });
    }

    const userId = tokenResult.userId;

    if (typeof reason !== "string" || reason.length > 2000) {
      return res.status(400).json({ error: "Reason must be a string of 2000 characters or less" });
    }

    if (supportingContext && (typeof supportingContext !== "string" || supportingContext.length > 5000)) {
      return res.status(400).json({ error: "Supporting context must be a string of 5000 characters or less" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.accountStatus !== "banned" && user.accountStatus !== "suspended") {
      return res.status(400).json({ error: "Only banned or suspended users can submit appeals" });
    }

    const existingAppeals = await storage.getBanAppealsByUser(userId);
    const hasPendingAppeal = existingAppeals.some(a => a.status === "pending");
    if (hasPendingAppeal) {
      return res.status(400).json({ error: "You already have a pending appeal. Please wait for a response." });
    }

    const userEmail = user.email;
    const userName = user.name || null;

    const appeal = await storage.createBanAppeal({
      userId,
      userEmail,
      userName,
      reason,
      supportingContext: supportingContext || null,
      status: "pending",
      adminResponse: null,
      reviewedBy: null,
    });

    try {
      const { emailService } = await import("../services/email-service");
      const allUsers = await storage.getAllUsers();
      const admins = allUsers.filter((u: any) => u.globalRole === "OWNER" || u.globalRole === "STAFF");
      for (const admin of admins) {
        await emailService.sendEmail({
          to: admin.email,
          subject: "BilliardsLadder - New Ban Appeal Submitted",
          html: generateAppealSubmittedEmailHtml(userName || userEmail, reason),
        });
      }
    } catch (emailErr) {
      console.error("[AppealSystem] Failed to send appeal notification email:", emailErr);
    }

    return res.json({ message: "Appeal submitted successfully", appeal });
  } catch (error: any) {
    console.error("Submit appeal error:", error);
    return res.status(500).json({ error: "Failed to submit appeal" });
  }
}

export async function getAllAppeals(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    let appeals;
    if (status) {
      appeals = await storage.getBanAppealsByStatus(status);
    } else {
      appeals = await storage.getAllBanAppeals();
    }

    const enriched = await Promise.all(
      appeals.map(async (appeal: any) => {
        const user = await storage.getUser(appeal.userId);
        return {
          ...appeal,
          userAccountStatus: user?.accountStatus || "unknown",
          userGlobalRole: user?.globalRole || "unknown",
        };
      })
    );

    return res.json(enriched);
  } catch (error: any) {
    console.error("Get appeals error:", error);
    return res.status(500).json({ error: "Failed to fetch appeals" });
  }
}

export async function getUserAppeals(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const appeals = await storage.getBanAppealsByUser(userId);
    return res.json(appeals);
  } catch (error: any) {
    console.error("Get user appeals error:", error);
    return res.status(500).json({ error: "Failed to fetch user appeals" });
  }
}

export async function reviewAppeal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, adminResponse } = req.body;
    const adminUser = (req as any).dbUser;

    if (!action || !["approve", "deny"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'deny'" });
    }

    const appeal = await storage.getBanAppeal(id);
    if (!appeal) {
      return res.status(404).json({ error: "Appeal not found" });
    }

    if (appeal.status !== "pending") {
      return res.status(400).json({ error: "This appeal has already been reviewed" });
    }

    const newStatus = action === "approve" ? "approved" : "denied";

    await storage.updateBanAppeal(id, {
      status: newStatus,
      adminResponse: adminResponse || null,
      reviewedBy: adminUser?.id || "admin",
      reviewedAt: new Date(),
    });

    if (action === "approve") {
      await storage.updateUser(appeal.userId, {
        accountStatus: "active",
        banReason: null,
        bannedAt: null,
        bannedBy: null,
        banExpiresAt: null,
      });
    }

    try {
      const { emailService } = await import("../services/email-service");
      const subject = action === "approve"
        ? "BilliardsLadder - Appeal Approved"
        : "BilliardsLadder - Appeal Denied";
      await emailService.sendEmail({
        to: appeal.userEmail,
        subject,
        html: generateAppealResponseEmailHtml(
          appeal.userName || appeal.userEmail,
          newStatus,
          adminResponse || ""
        ),
      });
    } catch (emailErr) {
      console.error("[AppealSystem] Failed to send appeal response email:", emailErr);
    }

    return res.json({ message: `Appeal ${newStatus}`, appealId: id });
  } catch (error: any) {
    console.error("Review appeal error:", error);
    return res.status(500).json({ error: "Failed to review appeal" });
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateAppealSubmittedEmailHtml(userName: string, reason: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Courier New',monospace;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#111111;">
        <div style="text-align:center;padding:30px 0;border-bottom:2px solid #f59e0b;margin-bottom:30px;">
          <div style="font-size:32px;font-weight:bold;color:#f59e0b;margin-bottom:10px;">BILLIARDS LADDER</div>
          <div style="color:#888888;font-size:14px;font-style:italic;">Admin Notification</div>
        </div>
        <div style="padding:20px 0;">
          <h2 style="color:#f59e0b;margin-bottom:20px;">New Ban Appeal</h2>
          <p style="color:#cccccc;font-size:16px;">A new ban appeal has been submitted by <strong style="color:white;">${escapeHtml(userName)}</strong>.</p>
          <div style="background:#1a1500;border:1px solid #f59e0b;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px 0;">Appeal Reason:</p>
            <p style="color:#cccccc;margin:0;">${escapeHtml(reason)}</p>
          </div>
          <p style="color:#cccccc;font-size:16px;">Please review this appeal in the Admin Dashboard.</p>
        </div>
        <div style="background:#0a0a0a;color:#555555;padding:20px;text-align:center;font-size:12px;border-top:1px solid #222222;">
          <p style="margin:0;">BilliardsLadder &mdash; Pool &bull; Points &bull; Pride</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAppealResponseEmailHtml(userName: string, status: string, adminResponse: string): string {
  const isApproved = status === "approved";
  const color = isApproved ? "#00ff00" : "#ef4444";
  const title = isApproved ? "Appeal Approved" : "Appeal Denied";
  const message = isApproved
    ? "Your ban appeal has been approved. Your account has been reinstated and you can now log in."
    : "Your ban appeal has been reviewed and denied. The original decision stands.";

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Courier New',monospace;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#111111;">
        <div style="text-align:center;padding:30px 0;border-bottom:2px solid ${color};margin-bottom:30px;">
          <div style="font-size:32px;font-weight:bold;color:${color};margin-bottom:10px;">BILLIARDS LADDER</div>
          <div style="color:#888888;font-size:14px;font-style:italic;">In here, respect is earned in racks, not words</div>
        </div>
        <div style="padding:20px 0;">
          <h2 style="color:${color};margin-bottom:20px;">${title}</h2>
          <p style="color:#cccccc;font-size:16px;">Hello ${escapeHtml(userName)},</p>
          <p style="color:#cccccc;font-size:16px;">${message}</p>
          ${adminResponse ? `
          <div style="background:${isApproved ? '#001a00' : '#1a0000'};border:1px solid ${color};border-radius:6px;padding:16px;margin:20px 0;">
            <p style="color:${color};font-weight:bold;margin:0 0 8px 0;">Admin Response:</p>
            <p style="color:#cccccc;margin:0;">${escapeHtml(adminResponse)}</p>
          </div>
          ` : ''}
          ${isApproved ? `
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.APP_BASE_URL || 'http://localhost:5000'}/login"
               style="background:#059669;color:white;padding:14px 40px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:16px;letter-spacing:1px;">
              LOG IN NOW
            </a>
          </div>
          ` : ''}
        </div>
        <div style="background:#0a0a0a;color:#555555;padding:20px;text-align:center;font-size:12px;border-top:1px solid #222222;">
          <p style="margin:0;">BilliardsLadder &mdash; Pool &bull; Points &bull; Pride</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Aliases for route naming consistency
export const getPayoutHistory = getPayouts;
export const getConnectAccountStatus = getConnectStatus;
export const updateOrganizationSeats = updateOrgSeats;
export const getSubscriptionDetails = getOrgSubscription;
export const toggleFreeMonth = toggleFreeMonths;
export const updateOperatorCustomization = updateOperatorSettings;
