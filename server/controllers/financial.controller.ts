import { Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { IStorage } from "../storage";
import { sanitizeBody, createStripeDescription } from "../utils/sanitize";
import { createSafeCheckoutSession } from "../utils/stripeSafe";
import { refundDeposit, refundMatchEntry, refundTournamentEntry, canRefundPayment } from "../services/refund-service";
import { calculateCommission, MEMBERSHIP_TIERS, COMMISSION_CONFIG, calculateSavings } from "../services/pricing-service";
import { insertOperatorSubscriptionSchema } from "@shared/schema";
import { OperatorSubscriptionCalculator } from "../utils/operator-subscription-utils";
import { calculateOperatorSubscriptionSplit } from "../services/operatorSubscriptionSplits";
import { payStaffFromInvoice } from "../routes/admin.routes";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

function getAppBaseUrl(): string {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replitDomain) {
    return `https://${replitDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  return "http://localhost:5000";
}

const prices = {
  rookie_monthly: process.env.PLAYER_ROOKIE_MONTHLY_PRICE_ID || "price_1THmhwDvTG8XWAaKP5IdXAic",
  basic_monthly: process.env.PLAYER_STANDARD_MONTHLY_PRICE_ID || "price_1THmi0DvTG8XWAaKGZwVO8WR",
  pro_monthly: process.env.PLAYER_PREMIUM_MONTHLY_PRICE_ID || "price_1THmi2DvTG8XWAaKpyx6VNyR",
  small: process.env.SMALL_PRICE_ID || "price_1THmiLDvTG8XWAaKhXE4JvZq",
  medium: process.env.MEDIUM_PRICE_ID || "price_1THmiPDvTG8XWAaKkeveuEqq",
  large: process.env.LARGE_PRICE_ID || "price_1THmiRDvTG8XWAaK39Gg3Nb9",
  mega: process.env.MEGA_PRICE_ID || "price_1THmiUDvTG8XWAaKa43Y9Bm9",
  charity_product: "prod_UGJKFusMczHWQ3",
  charity_donations: {
    "5": "price_1THmi4DvTG8XWAaKLE6mESxA",
    "10": "price_1THmi7DvTG8XWAaKdKDzSjXE",
    "25": "price_1THmi9DvTG8XWAaKY0S3p2Cf",
    "50": "price_1THmiCDvTG8XWAaKbUxZQUnc",
    "100": "price_1THmiEDvTG8XWAaK0aXNtqxB",
    "250": "price_1THmiGDvTG8XWAaK1Lh1RO9i",
    "500": "price_1THmiJDvTG8XWAaKPVETvXvR"
  }
};

// ==================== PRICING CONTROLLERS ====================

export function getPricingTiers() {
  return async (req: Request, res: Response) => {
    try {
      const tiers = Object.entries(MEMBERSHIP_TIERS).map(([key, config]) => ({
        id: key.toLowerCase(),
        name: config.name,
        price: config.price,
        monthlyPrice: config.price / 100,
        commissionRate: config.commissionRate / 100,
        challengerFee: config.challengerFee,
        perks: config.perks,
        description: config.description,
      }));

      res.json({ tiers, commission: COMMISSION_CONFIG });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function calculateCommissionAmount() {
  return async (req: Request, res: Response) => {
    try {
      const { amount, membershipTier = "none" } = req.body;

      if (!amount || amount < 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }

      const commission = calculateCommission(amount, membershipTier);
      res.json(commission);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function calculateMembershipSavings() {
  return async (req: Request, res: Response) => {
    try {
      const { tier, monthlyMatches = 4 } = req.body;

      if (!tier) {
        return res.status(400).json({ message: "Membership tier required" });
      }

      const savings = calculateSavings(tier, monthlyMatches);
      res.json(savings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// ==================== BILLING CONTROLLERS ====================

export function createCheckoutSession() {
  return async (req: Request, res: Response) => {
    try {
      const appBaseUrl = getAppBaseUrl();
      const { priceIds = [], mode = 'subscription', quantities = [], metadata = {}, userId, customerId } = req.body;

      const line_items = priceIds.map((priceId: string, i: number) => ({
        price: priceId,
        quantity: quantities[i] ?? 1,
      }));

      const sessionPayload: any = {
        mode,
        line_items,
        success_url: `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl}/billing/cancel`,
        allow_promotion_codes: true,
        automatic_tax: { enabled: false },
        client_reference_id: userId,
        metadata: {
          userId: userId || "",
          pool_id: metadata.poolId || metadata.pool_id || "",
          product_type: metadata.productType || metadata.product_type || "subscription",
          hall_id: metadata.hallId || metadata.hall_id || "",
          ...metadata
        }
      };

      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId && stripe) {
        const dbUser = (req as any).dbUser;
        if (dbUser?.stripeCustomerId) {
          resolvedCustomerId = dbUser.stripeCustomerId;
        } else if (dbUser) {
          const customer = await stripe.customers.create({
            email: dbUser.email,
            name: dbUser.name,
            metadata: { userId: dbUser.id, userRole: dbUser.globalRole },
          });
          resolvedCustomerId = customer.id;
        }
      }

      if (resolvedCustomerId) {
        sessionPayload.customer = resolvedCustomerId;
      }

      const session = await createSafeCheckoutSession(sessionPayload);

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  };
}

export function createBillingPortalSession() {
  return async (req: Request, res: Response) => {
    try {
      const appBaseUrl = getAppBaseUrl();
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ message: "Customer ID required" });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appBaseUrl}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating portal session: " + error.message });
    }
  };
}

export function createPaymentIntent() {
  return async (req: Request, res: Response) => {
    try {
      const { amount, tournamentId, kellyPoolId, poolId, productType, hallId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          tournamentId: tournamentId || "",
          kellyPoolId: kellyPoolId || "",
          pool_id: poolId || tournamentId || kellyPoolId || "",
          product_type: productType || "tournament_entry_fee",
          hall_id: hallId || "",
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  };
}

// ==================== REFUND CONTROLLERS ====================

export function refundDepositController(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, amountCents, reason, userId, metadata } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment Intent ID required" });
      }

      const refund = await refundDeposit({
        paymentIntentId,
        amountCents,
        reason,
        metadata
      });

      res.json(refund);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function refundMatchEntryController(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, matchId, userId, amountCents } = req.body;

      if (!paymentIntentId || !matchId || !userId) {
        return res.status(400).json({
          message: "Payment Intent ID, match ID, and user ID are required"
        });
      }

      const refund = await refundMatchEntry(paymentIntentId, matchId, userId, amountCents);
      res.json(refund);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function refundTournamentEntryController(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, tournamentId, userId, reason } = req.body;

      if (!paymentIntentId || !tournamentId || !userId) {
        return res.status(400).json({
          message: "Payment Intent ID, tournament ID, and user ID are required"
        });
      }

      const refund = await refundTournamentEntry(paymentIntentId, tournamentId, userId, reason);
      res.json(refund);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function checkRefundEligibility() {
  return async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.params;
      const eligibility = await canRefundPayment(paymentIntentId);
      res.json(eligibility);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// ==================== WALLET CONTROLLERS ====================

export function getWallet(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      let wallet = await storage.getWallet(req.params.userId);
      if (!wallet) {
        wallet = await storage.createWallet({
          userId: req.params.userId,
          balanceCredits: 0,
          balanceLockedCredits: 0,
        });
      }
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getWalletLedger(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const entries = await storage.getLedgerByUser(req.params.userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function topUpWallet() {
  return async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      const userId = req.params.userId;

      if (!amount || amount < 5) {
        return res.status(400).json({ message: "Minimum top-up is $5" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          userId,
          type: "wallet_topup",
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function completeTopUp(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, amount } = req.body;
      const userId = req.params.userId;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const wallet = await storage.creditWallet(userId, amount * 100);

      await storage.createLedgerEntry({
        userId,
        type: "credit_topup",
        amount: amount * 100,
        refId: paymentIntentId,
        metaJson: JSON.stringify({ paymentMethod: "stripe" }),
      });

      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// ==================== OPERATOR SUBSCRIPTION CONTROLLERS ====================

export function getOperatorSubscriptions(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getAllOperatorSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getOperatorSubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { operatorId } = req.params;
      const subscription = await storage.getOperatorSubscription(operatorId);
      if (!subscription) {
        return res.status(404).json({ message: "Operator subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createOperatorSubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertOperatorSubscriptionSchema.parse(req.body);
      const subscription = await storage.createOperatorSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateOperatorSubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { operatorId } = req.params;
      const subscription = await storage.updateOperatorSubscription(operatorId, req.body);
      if (!subscription) {
        return res.status(404).json({ message: "Operator subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function calculateOperatorSubscriptionCost() {
  return async (req: Request, res: Response) => {
    try {
      const { playerCount, extraLadders = 0, rookieModuleActive = false, rookiePassesActive = 0 } = req.body;

      if (!playerCount || playerCount < 1) {
        return res.status(400).json({ message: "Player count is required and must be at least 1" });
      }

      const pricing = OperatorSubscriptionCalculator.calculateTotalCost({
        playerCount,
        extraLadders,
        rookieModuleActive,
        rookiePassesActive
      });

      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getOperatorSubscriptionSplits(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { operatorId } = req.params;
      const splits = await storage.getOperatorSubscriptionSplits(operatorId);
      res.json(splits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getOperatorSubscriptionSplitsBySubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const splits = await storage.getOperatorSubscriptionSplitsBySubscription(subscriptionId);
      res.json(splits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getOperatorTiers(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const tiers = await storage.getOperatorTiers();
      res.json(tiers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getOperatorTier(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tier = await storage.getOperatorTier(id);
      if (!tier) {
        return res.status(404).json({ message: "Operator tier not found" });
      }
      res.json(tier);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getTrusteeEarnings(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { trusteeId } = req.params;
      const earnings = await storage.getTrusteeEarnings(trusteeId);
      res.json(earnings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// ==================== STRIPE WEBHOOK ====================

// Webhook idempotency functions
async function alreadyProcessed(storage: IStorage, eventId: string): Promise<boolean> {
  const existingEvent = await storage.getWebhookEvent(eventId);
  return !!existingEvent;
}

async function markProcessed(storage: IStorage, eventId: string, eventType: string, payload: any): Promise<void> {
  await storage.createWebhookEvent({
    stripeEventId: eventId,
    eventType,
    payloadJson: JSON.stringify(payload)
  });
}

// Webhook event handlers
async function handleCheckoutCompleted(storage: IStorage, session: any): Promise<void> {
  const userId = session.client_reference_id || session.metadata?.userId;

  if (session.mode === 'payment') {
    if (session.metadata?.tournamentId) {
      const tournamentId = session.metadata.tournamentId;
      const tournament = await storage.getTournament(tournamentId);
      if (tournament) {
        await storage.updateTournament(tournamentId, {
          currentPlayers: (tournament.currentPlayers || 0) + 1
        });
      }
    }

    if (session.metadata?.kellyPoolId) {
      const kellyPoolId = session.metadata.kellyPoolId;
      const kellyPool = await storage.getKellyPool(kellyPoolId);
      if (kellyPool) {
        await storage.updateKellyPool(kellyPoolId, {
          currentPlayers: (kellyPool.currentPlayers || 0) + 1
        });
      }
    }
  }

  if (session.mode === 'subscription') {
    const playerId = session.metadata?.playerId;
    const subscriptionType = session.metadata?.subscriptionType;
    const type = session.metadata?.type;
    const tier = session.metadata?.tier;

    if (subscriptionType === 'rookie_pass' && playerId) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await storage.createRookieSubscription({
        playerId,
        stripeSubscriptionId: session.subscription as string,
        expiresAt,
      });

      await storage.updatePlayer(playerId, {
        rookiePassActive: true,
        rookiePassExpiresAt: expiresAt,
      });
    } else if (type === 'player_subscription' && tier && userId) {
      console.log(`Player subscription checkout completed for user ${userId} with tier ${tier}`);
    } else if (userId) {
      const resolvedPlayerId = await resolvePlayerId(storage, userId, playerId);

      if (!resolvedPlayerId) {
        console.error(`❌ Player not found for checkout-complete user ${userId}`);
        return;
      }

      await storage.updatePlayer(resolvedPlayerId, {
        member: true,
        stripeCustomerId: session.customer as string
      });
    }
  }
}

async function resolvePlayerId(storage: IStorage, userId?: string, playerId?: string): Promise<string | undefined> {
  if (playerId) {
    return playerId;
  }

  if (!userId) {
    return undefined;
  }

  const player = await storage.getPlayerByUserId(userId);
  return player?.id;
}

async function handleSubscription(storage: IStorage, subscription: any): Promise<void> {
  const userId = subscription.metadata?.userId;
  const playerId = subscription.metadata?.playerId;
  const subscriptionType = subscription.metadata?.subscriptionType;
  const tier = subscription.metadata?.tier;

  if (subscriptionType === 'rookie_pass' && playerId) {
    const isActive = subscription.status === 'active';
    const expiresAt = isActive ? new Date((subscription as any).current_period_end * 1000) : null;

    await storage.updatePlayer(playerId, {
      rookiePassActive: isActive,
      rookiePassExpiresAt: expiresAt,
    });

    const existingSubscription = await storage.getRookieSubscription(playerId);
    if (existingSubscription) {
      await storage.updateRookieSubscription(playerId, {
        status: subscription.status,
        expiresAt: expiresAt,
      });
    }
  } else if (tier && userId) {
    const isActive = subscription.status === 'active';
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    const resolvedPlayerId = await resolvePlayerId(storage, userId, playerId);

    if (!resolvedPlayerId) {
      console.error(`❌ Player not found for subscription user ${userId}`);
      return;
    }

    const existingSubscription = await storage.getMembershipSubscriptionByPlayerId(resolvedPlayerId);

    if (existingSubscription) {
      console.log(`✅ Updating player subscription for user ${userId}: ${tier} (${subscription.status})`);
      await storage.updateMembershipSubscription(existingSubscription.id, {
        status: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        tier
      });
      await storage.updatePlayer(resolvedPlayerId, { member: isActive });
    } else {
      const user = await storage.getUser(userId);
      if (user) {
        console.log(`✅ Creating new player subscription for user ${userId}: ${tier}`);
        try {
          await storage.createMembershipSubscription({
            playerId: resolvedPlayerId,
            tier,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: user.stripeCustomerId || subscription.customer,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            monthlyPrice: subscription.items.data[0]?.price?.unit_amount || 0,
            perks: [],
            commissionRate: tier === 'rookie' ? 1000 : tier === 'standard' ? 800 : 500
          });
          await storage.updatePlayer(resolvedPlayerId, { member: isActive });
        } catch (error: any) {
          console.error(`❌ Failed to create membership subscription for user ${userId}:`, error.message);
          throw error;
        }
      } else {
        console.error(`❌ User not found for subscription creation: ${userId}`);
      }
    }
  } else if (userId) {
    const isActive = subscription.status === 'active';
    const resolvedPlayerId = await resolvePlayerId(storage, userId, playerId);

    if (!resolvedPlayerId) {
      console.error(`❌ Player not found for subscription user ${userId}`);
      return;
    }

    await storage.updatePlayer(resolvedPlayerId, {
      member: isActive
    });
  }
}

async function handleInvoicePaid(storage: IStorage, invoice: any): Promise<void> {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    const playerId = subscription.metadata?.playerId;
    const subscriptionType = subscription.metadata?.subscriptionType;
    const operatorId = subscription.metadata?.operatorId;
    const hallId = subscription.metadata?.hallId;

    if (subscriptionType === 'rookie_pass' && playerId) {
      const expiresAt = new Date((subscription as any).current_period_end * 1000);

      await storage.updatePlayer(playerId, {
        rookiePassActive: true,
        rookiePassExpiresAt: expiresAt,
      });

      const existingSubscription = await storage.getRookieSubscription(playerId);
      if (existingSubscription) {
        await storage.updateRookieSubscription(playerId, {
          expiresAt: expiresAt,
        });
      }
    } else if (operatorId && hallId) {
      const amountCents = invoice.amount_paid;

      const operator = await storage.getUser(operatorId);
      const trusteeId = (operator as any)?.trusteeId;

      const split = calculateOperatorSubscriptionSplit(amountCents);

      const billingPeriodStart = new Date((subscription as any).current_period_start * 1000);
      const billingPeriodEnd = new Date((subscription as any).current_period_end * 1000);

      await storage.createOperatorSubscriptionSplit({
        subscriptionId: subscription.id,
        operatorId,
        trusteeId: trusteeId || undefined,
        potAmount: split.potAmount,
        trusteeAmount: split.trusteeAmount,
        founderAmount: split.founderAmount,
        payrollAmount: split.payrollAmount,
        totalAmount: amountCents,
        stripePaymentIntentId: invoice.payment_intent || undefined,
        billingPeriodStart,
        billingPeriodEnd,
      });

      console.log(`✅ Operator subscription split recorded for operator ${operatorId}: $${(amountCents / 100).toFixed(2)}`);
      console.log(`   Pot: $${(split.potAmount / 100).toFixed(2)} | Trustee: $${(split.trusteeAmount / 100).toFixed(2)} | Founder: $${(split.founderAmount / 100).toFixed(2)} | Payroll: $${(split.payrollAmount / 100).toFixed(2)}`);
    } else if (userId) {
      const resolvedPlayerId = await resolvePlayerId(storage, userId, playerId);

      if (!resolvedPlayerId) {
        console.error(`❌ Player not found for invoice subscription user ${userId}`);
        return;
      }

      await storage.updatePlayer(resolvedPlayerId, {
        member: true
      });
    }
  }

  try {
    await payStaffFromInvoice(invoice);
    console.log(`✅ Revenue split processed for invoice ${invoice.id}`);
  } catch (error: any) {
    console.error(`❌ Revenue split failed for invoice ${invoice.id}:`, error.message);
  }
}

async function handleInvoiceFailed(storage: IStorage, invoice: any): Promise<void> {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    if (subscription.metadata?.userId) {
      console.log(`Payment failed for user: ${subscription.metadata.userId}`);
    }
  }
}

async function handleOneTime(paymentIntent: any): Promise<void> {
  console.log(`One-time payment succeeded: ${paymentIntent.id}`);
}

async function handleCharityDonation(storage: IStorage, paymentIntent: any): Promise<void> {
  const { charity_event_id, amount } = paymentIntent.metadata;

  if (charity_event_id && amount) {
    try {
      const charityEvent = await storage.getCharityEvent(charity_event_id);
      if (charityEvent) {
        const donationAmount = parseInt(amount);
        await storage.updateCharityEvent(charity_event_id, {
          raised: (charityEvent.raised ?? 0) + donationAmount
        });
        console.log(`✅ Charity donation processed: $${donationAmount} for event ${charity_event_id}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to process charity donation:`, error.message);
    }
  }
}

async function handleRefund(charge: any): Promise<void> {
  console.log(`Charge refunded: ${charge.id}`);
}

export function stripeWebhookHandler(storage: IStorage) {
  return async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Missing webhook secret" });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (e: any) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    if (await alreadyProcessed(storage, event.id)) return res.sendStatus(200);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(storage, event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await handleSubscription(storage, event.data.object);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(storage, event.data.object);
          break;
        case 'invoice.payment_failed':
          await handleInvoiceFailed(storage, event.data.object);
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          if (paymentIntent.metadata?.type === 'charity_donation') {
            await handleCharityDonation(storage, paymentIntent);
          } else {
            await handleOneTime(paymentIntent);
          }
          break;
        case 'charge.refunded':
          await handleRefund(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      await markProcessed(storage, event.id, event.type, event.data.object);
      res.sendStatus(200);
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ message: error.message });
    }
  };
}
