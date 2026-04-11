import type { Express } from "express";
import express from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import * as financialController from "../controllers/financial.controller";
import { isAuthenticated } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";

export function setupFinancialRoutes(app: Express, storage: IStorage) {
  // ==================== PRICING ROUTES ====================
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
    financialController.createCheckoutSession()
  );

  app.post("/api/billing/portal",
    financialController.createBillingPortalSession()
  );

  app.post("/api/create-payment-intent",
    isAuthenticated,
    sanitizeBody(["description", "statement_descriptor"]),
    financialController.createPaymentIntent()
  );

  // ==================== REFUND ROUTES ====================
  app.post("/api/refunds/deposit",
    financialController.refundDepositController(storage)
  );

  app.post("/api/refunds/match-entry",
    financialController.refundMatchEntryController(storage)
  );

  app.post("/api/refunds/tournament-entry",
    financialController.refundTournamentEntryController(storage)
  );

  app.get("/api/refunds/check/:paymentIntentId",
    financialController.checkRefundEligibility()
  );

  // ==================== WALLET ROUTES ====================
  app.get("/api/wallet/:userId",
    financialController.getWallet(storage)
  );

  app.get("/api/wallet/:userId/ledger",
    financialController.getWalletLedger(storage)
  );

  app.post("/api/wallet/:userId/topup",
    financialController.topUpWallet()
  );

  app.post("/api/wallet/:userId/topup/complete",
    financialController.completeTopUp(storage)
  );

  // ==================== OPERATOR SUBSCRIPTION ROUTES ====================
  app.get("/api/operator-subscriptions",
    financialController.getOperatorSubscriptions(storage)
  );

  app.get("/api/operator-subscriptions/:operatorId",
    financialController.getOperatorSubscription(storage)
  );

  app.post("/api/operator-subscriptions",
    financialController.createOperatorSubscription(storage)
  );

  app.put("/api/operator-subscriptions/:operatorId",
    financialController.updateOperatorSubscription(storage)
  );

  app.post("/api/operator-subscriptions/calculate",
    financialController.calculateOperatorSubscriptionCost()
  );

  // ==================== OPERATOR SUBSCRIPTION SPLIT ROUTES ====================
  app.get("/api/operator-subscription-splits/:operatorId",
    financialController.getOperatorSubscriptionSplits(storage)
  );

  app.get("/api/operator-subscription-splits/by-subscription/:subscriptionId",
    financialController.getOperatorSubscriptionSplitsBySubscription(storage)
  );

  // ==================== OPERATOR TIER ROUTES ====================
  app.get("/api/operator-tiers",
    financialController.getOperatorTiers(storage)
  );

  app.get("/api/operator-tiers/:id",
    financialController.getOperatorTier(storage)
  );

  // ==================== TRUSTEE EARNINGS ROUTE ====================
  app.get("/api/trustee-earnings/:trusteeId",
    financialController.getTrusteeEarnings(storage)
  );

  // ==================== STRIPE WEBHOOK ====================
  app.post("/api/stripe/webhook",
    express.raw({ type: 'application/json' }),
    financialController.stripeWebhookHandler(storage)
  );
}
