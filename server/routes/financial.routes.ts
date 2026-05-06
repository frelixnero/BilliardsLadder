import type { Express } from "express";
import express from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import * as financialController from "../controllers/financial.controller";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";

export function setupFinancialRoutes(app: Express, storage: IStorage) {
  // ==================== PRICING ROUTES (public marketing) ====================
  app.get("/api/pricing/tiers", financialController.getPricingTiers());

  app.post("/api/pricing/calculate-commission",
    financialController.calculateCommissionAmount()
  );

  app.post("/api/pricing/calculate-savings",
    financialController.calculateMembershipSavings()
  );

  // ==================== BILLING ROUTES ====================
  app.post("/api/billing/checkout",
    requireAnyAuth,
    sanitizeBody(["description", "name", "title"]),
    financialController.createCheckoutSession(storage)
  );

  app.post("/api/billing/portal",
    requireAnyAuth,
    financialController.createBillingPortalSession()
  );

  app.post("/api/create-payment-intent",
    isAuthenticated,
    sanitizeBody(["description", "statement_descriptor"]),
    financialController.createPaymentIntent()
  );

  // ==================== REFUND ROUTES (staff-only) ====================
  app.post("/api/refunds/deposit",
    requireStaffOrOwner,
    financialController.refundDepositController(storage)
  );

  app.post("/api/refunds/match-entry",
    requireStaffOrOwner,
    financialController.refundMatchEntryController(storage)
  );

  app.post("/api/refunds/tournament-entry",
    requireStaffOrOwner,
    financialController.refundTournamentEntryController(storage)
  );

  app.get("/api/refunds/check/:paymentIntentId",
    requireAnyAuth,
    financialController.checkRefundEligibility()
  );

  // ==================== WALLET ROUTES (auth required; controller must enforce ownership) ====================
  app.get("/api/wallet/:userId",
    requireAnyAuth,
    financialController.getWallet(storage)
  );

  app.get("/api/wallet/:userId/ledger",
    requireAnyAuth,
    financialController.getWalletLedger(storage)
  );

  app.post("/api/wallet/:userId/topup",
    requireAnyAuth,
    financialController.topUpWallet()
  );

  app.post("/api/wallet/:userId/topup/complete",
    requireAnyAuth,
    financialController.completeTopUp(storage)
  );

  // ==================== OPERATOR SUBSCRIPTION ROUTES ====================
  app.get("/api/operator-subscriptions",
    requireAnyAuth,
    financialController.getOperatorSubscriptions(storage)
  );

  app.get("/api/operator-subscriptions/eligibility",
    requireAnyAuth,
    financialController.getOperatorSubscriptionEligibility(storage)
  );

  app.get("/api/operator-subscriptions/:operatorId",
    requireAnyAuth,
    financialController.getOperatorSubscription(storage)
  );

  app.post("/api/operator-subscriptions",
    requireAnyAuth,
    financialController.createOperatorSubscription(storage)
  );

  app.put("/api/operator-subscriptions/:operatorId",
    requireAnyAuth,
    financialController.updateOperatorSubscription(storage)
  );

  app.post("/api/operator-subscriptions/verify-session",
    requireAnyAuth,
    financialController.verifyOperatorSession(storage)
  );

  // Public: lets prospective operators see pricing before signup
  app.post("/api/operator-subscriptions/calculate",
    financialController.calculateOperatorSubscriptionCost()
  );

  // ==================== OPERATOR SUBSCRIPTION SPLIT ROUTES (staff-only — money flow) ====================
  app.get("/api/operator-subscription-splits/:operatorId",
    requireStaffOrOwner,
    financialController.getOperatorSubscriptionSplits(storage)
  );

  app.get("/api/operator-subscription-splits/by-subscription/:subscriptionId",
    requireStaffOrOwner,
    financialController.getOperatorSubscriptionSplitsBySubscription(storage)
  );

  // ==================== OPERATOR TIER ROUTES (public marketing) ====================
  app.get("/api/operator-tiers",
    financialController.getOperatorTiers(storage)
  );

  app.get("/api/operator-tiers/:id",
    financialController.getOperatorTier(storage)
  );

  // ==================== TRUSTEE EARNINGS (staff-only — money) ====================
  app.get("/api/trustee-earnings/:trusteeId",
    requireStaffOrOwner,
    financialController.getTrusteeEarnings(storage)
  );

  // ==================== STRIPE WEBHOOK (signature-verified, must be public) ====================
  app.post("/api/stripe/webhook",
    express.raw({ type: 'application/json' }),
    financialController.stripeWebhookHandler(storage)
  );
}
