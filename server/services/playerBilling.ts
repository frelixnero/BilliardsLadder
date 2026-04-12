import { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { requireAnyAuth } from "../middleware/auth";

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

// Player subscription tiers - designed to compete with traditional leagues
export function getPlayerSubscriptionTier(tier: string) {
  switch (tier) {
    case "rookie":
      return {
        tier: "rookie",
        name: "Rookie",
        monthlyPrice: 2500, // $25/month
        yearlyPrice: 25500, // $255/year (save $45)
        priceId: process.env.PLAYER_ROOKIE_MONTHLY_PRICE_ID || "price_1THmhwDvTG8XWAaKP5IdXAic",
        yearlyPriceId: process.env.PLAYER_ROOKIE_YEARLY_PRICE_ID || "price_1THmhwDvTG8XWAaKP5IdXAic",
        traditionalLeagueCost: 3700, // $37/month typical league cost
        monthlySavings: 1200, // $12/month savings
        yearlySavings: 18500, // $185/year savings
        challengerFee: 0,
        perks: [
          "Access to all ladder divisions",
          "Challenge match system",
          "Basic tournament entries",
          "Match history tracking",
          "10% commission rate on side bets",
          "Weekly streak bonuses",
          "Community features"
        ],
        commissionRate: 1000, // 10% in basis points
        description: "Perfect for new players entering the competitive billiards world"
      };
    case "standard":
      return {
        tier: "standard",
        name: "Standard",
        monthlyPrice: 3500, // $35/month
        yearlyPrice: 35700, // $357/year (save $63)
        priceId: process.env.PLAYER_STANDARD_MONTHLY_PRICE_ID || "price_1THmi0DvTG8XWAaKGZwVO8WR",
        yearlyPriceId: process.env.PLAYER_STANDARD_YEARLY_PRICE_ID || "price_1THmi0DvTG8XWAaKGZwVO8WR",
        traditionalLeagueCost: 3700, // $37/month typical league cost
        monthlySavings: 200, // $2/month savings
        yearlySavings: 2300, // $23/year savings
        challengerFee: 6000,
        perks: [
          "Everything in Rookie",
          "$60 challenger fee per match",
          "Premium tournament access",
          "Advanced analytics & insights",
          "Live stream priority placement",
          "8% commission rate on side bets",
          "Monthly bonus challenges",
          "Priority customer support",
          "AI coaching tips"
        ],
        commissionRate: 800, // 8% in basis points
        description: "For serious players who want competitive advantages and insights"
      };
    case "premium":
      return {
        tier: "premium",
        name: "Premium",
        monthlyPrice: 4500, // $45/month
        yearlyPrice: 45900, // $459/year (save $81)
        priceId: process.env.PLAYER_PREMIUM_MONTHLY_PRICE_ID || "price_1THmi2DvTG8XWAaKpyx6VNyR",
        yearlyPriceId: process.env.PLAYER_PREMIUM_YEARLY_PRICE_ID || "price_1THmi2DvTG8XWAaKpyx6VNyR",
        traditionalLeagueCost: 3700, // $37/month typical league cost
        monthlySavings: -800, // $8/month more but saves $40+ through perks
        yearlySavings: -1900, // $19/year more but saves $400+ annually through perks
        challengerFee: 6000,
        perks: [
          "Everything in Standard",
          "$60 challenger fee per match",
          "VIP tournament seeding",
          "Personal performance coaching",
          "Fan tip collection system",
          "5% commission rate on side bets (vs 10% for Rookie)",
          "Exclusive premium events",
          "Direct line to pros for mentoring",
          "Revenue sharing on content creation",
          "White-glove support",
          "Loyalty discount: 10% off after 6 months",
          "Referral bonus: $10 credit per successful referral",
          "Free monthly tutoring session ($30 value)",
          "Tournament winnings bonus: Keep 95% vs 90%"
        ],
        commissionRate: 500, // 5% in basis points
        description: "Elite tier for top competitors and content creators"
      };
    default:
      return null;
  }
}

export function registerPlayerBillingRoutes(app: Express) {
  const appBaseUrl = getAppBaseUrl();

  // Get player subscription tiers and pricing
  app.get("/api/player-billing/tiers", (req, res) => {
    const tiers = ["rookie", "standard", "premium"].map(tier => getPlayerSubscriptionTier(tier));
    res.json({ tiers });
  });

  // Get premium user savings breakdown
  app.get("/api/player-billing/premium-savings", requireAnyAuth, async (req, res) => {
    try {
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const subscription = await storage.getMembershipSubscriptionByPlayerId(player.id);

      if (!subscription || subscription.tier !== 'premium') {
        return res.json({
          isPremium: false,
          message: "Premium subscription required to view savings breakdown"
        });
      }

      // Calculate actual savings for premium users
      const subscriptionCost = 4500; // $45/month
      const commissionSavings = 200 * 0.05 * 100; // $10/month from 5% vs 10% commission on $200 avg bets
      const tutoringValue = 3000; // $30/month free tutoring session
      const tournamentBonus = 100 * 0.05 * 100; // $5/month from 95% vs 90% tournament winnings on $100 avg
      const referralCredits = 1000; // $10/month average referral bonus

      // Check loyalty discount eligibility
      const user = await storage.getUser(userId);
      let loyaltyDiscount = 0;
      let loyaltyEligible = false;

      if (user?.createdAt) {
        const sixMonthsAgo = new Date().getTime() - (6 * 30 * 24 * 60 * 60 * 1000);
        loyaltyEligible = new Date(user.createdAt).getTime() < sixMonthsAgo;
        if (loyaltyEligible) {
          loyaltyDiscount = subscriptionCost * 0.1; // 10% discount
        }
      }

      const totalSavings = commissionSavings + tutoringValue + tournamentBonus + referralCredits + loyaltyDiscount;
      const netCost = Math.max(subscriptionCost - totalSavings, 0);

      res.json({
        isPremium: true,
        subscriptionCost,
        savings: {
          commissionSavings,
          tutoringValue,
          tournamentBonus,
          referralCredits,
          loyaltyDiscount
        },
        totalSavings,
        netCost,
        loyaltyEligible,
        breakdown: {
          "Lower Commission (5% vs 10%)": `$${(commissionSavings / 100).toFixed(0)}/month`,
          "Free Monthly Tutoring": `$${(tutoringValue / 100).toFixed(0)}/month`,
          "Tournament Winnings Bonus": `$${(tournamentBonus / 100).toFixed(0)}/month`,
          "Referral Credits": `$${(referralCredits / 100).toFixed(0)}/month`,
          ...(loyaltyEligible && { "Loyalty Discount": `$${(loyaltyDiscount / 100).toFixed(2)}/month` })
        }
      });

    } catch (error: any) {
      console.error("Premium savings calculation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create player subscription checkout session
  app.post("/api/player-billing/checkout", requireAnyAuth, async (req, res) => {
    try {
      const { tier, billingPeriod = "monthly" } = req.body;

      if (!tier) {
        return res.status(400).json({ error: "tier required" });
      }

      // Get authenticated user ID from session
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const subscription = getPlayerSubscriptionTier(tier);
      if (!subscription) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      // Get or create Stripe customer for this user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
            userRole: user.globalRole
          }
        });
        customerId = customer.id;

        // Update user with Stripe customer ID
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Calculate amount based on billing period
      let amount = billingPeriod === "yearly" ? subscription.yearlyPrice : subscription.monthlyPrice;

      // Apply loyalty discount for Premium users (10% off after 6 months)
      if (tier === "premium" && user.createdAt &&
        new Date().getTime() - new Date(user.createdAt).getTime() > (6 * 30 * 24 * 60 * 60 * 1000)) {
        amount = Math.floor(amount * 0.9); // 10% loyalty discount
      }

      // Create checkout session with dynamic price (no need for pre-created price IDs)
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${subscription.name} Membership`,
              description: subscription.description,
            },
            unit_amount: amount,
            recurring: {
              interval: billingPeriod === "yearly" ? "year" : "month",
            },
          },
          quantity: 1
        }],
        success_url: `${appBaseUrl}/app?tab=dashboard&subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl}/app?tab=dashboard&subscription=cancelled`,
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            userId,
            tier: subscription.tier,
            billingPeriod,
            userRole: user.globalRole
          }
        },
        metadata: {
          userId,
          tier: subscription.tier,
          billingPeriod,
          type: "player_subscription"
        }
      });

      res.json({
        url: session.url,
        sessionId: session.id,
        subscription: {
          tier: subscription.name,
          price: amount,
          billingPeriod,
          savings: billingPeriod === "yearly" ? subscription.yearlySavings : subscription.monthlySavings
        }
      });

    } catch (error: any) {
      console.error("Player checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current player subscription status
  app.get("/api/player-billing/status", requireAnyAuth, async (req, res) => {
    try {
      // Get authenticated user ID from session
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get player from user ID
      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      // Check if user has active subscription in our database
      const subscription = await storage.getMembershipSubscriptionByPlayerId(player.id);

      if (!subscription) {
        return res.json({
          hasSubscription: false,
          tier: null,
          status: "none"
        });
      }

      const tierInfo = getPlayerSubscriptionTier(subscription.tier);

      res.json({
        hasSubscription: true,
        tier: subscription.tier,
        tierInfo,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        monthlyPrice: subscription.monthlyPrice,
        perks: subscription.perks || [],
        commissionRate: subscription.commissionRate
      });

    } catch (error: any) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/player-billing/verify-session", requireAnyAuth, async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId || !stripe) {
        console.error("❌ Verify session: Missing sessionId or stripe not initialized");
        return res.status(400).json({ error: "Session ID required" });
      }

      const userId = (req as any).dbUser.id;
      if (!userId) {
        console.error("❌ Verify session: No userId in dbUser");
        return res.status(401).json({ error: "Authentication required" });
      }

      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        console.error(`❌ Verify session: No player found for userId ${userId}`);
        return res.status(404).json({ error: "Player not found" });
      }

      console.log(`🔍 Verify session: Found player ${player.id} for userId ${userId}`);

      const existing = await storage.getMembershipSubscriptionByPlayerId(player.id);
      if (existing && existing.status === "active") {
        console.log(`✅ Verify session: Found existing active subscription for player ${player.id}`);
        const tierInfo = getPlayerSubscriptionTier(existing.tier);
        return res.json({
          hasSubscription: true,
          tier: existing.tier,
          status: existing.status,
          tierInfo,
        });
      }

      console.log(`🔍 Verify session: Retrieving session ${sessionId} from Stripe...`);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(`📦 Session status: ${session?.status}, payment_status: ${session?.payment_status}, metadata: ${JSON.stringify(session?.metadata)}`);

      // Check if session is in a successful state
      // Stripe sessions can be: "open", "complete", "expired"
      // payment_status can be: "unpaid", "paid", "no_payment_required"
      const isSuccessful = session?.payment_status === "paid" || session?.payment_status === "no_payment_required" || session?.status === "complete";

      if (!session || !isSuccessful) {
        console.warn(`⚠️  Verify session: Session not successful (status: ${session?.status}, payment_status: ${session?.payment_status})`);
        return res.json({
          hasSubscription: false,
          error: "Session not complete",
          sessionStatus: session?.status,
          paymentStatus: session?.payment_status
        });
      }

      let stripeSubId = session.subscription as string || null;
      const defaultPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      let periodEnd = defaultPeriodEnd;
      let tier = session.metadata?.tier || null;

      if (stripeSubId) {
        try {
          console.log(`📦 Retrieving subscription ${stripeSubId} from Stripe...`);
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          const rawEnd = stripeSub.current_period_end;
          console.log(`📦 raw current_period_end value: ${rawEnd} (type: ${typeof rawEnd})`);
          if (rawEnd && typeof rawEnd === "number" && rawEnd > 0) {
            const candidateDate = new Date(rawEnd * 1000);
            if (!isNaN(candidateDate.getTime())) {
              periodEnd = candidateDate;
            } else {
              console.warn(`⚠️ Invalid Date from current_period_end=${rawEnd}, using default`);
            }
          }
          if (!tier) {
            tier = stripeSub.metadata?.tier || null;
          }
          console.log(`✅ Subscription period ends: ${periodEnd.toISOString()}`);
        } catch (err) {
          console.error(`⚠️  Failed to retrieve subscription:`, err);
          periodEnd = defaultPeriodEnd;
        }
      }

      if (!tier) {
        console.error(`❌ Verify session: No tier found in session or subscription metadata for sessionId ${sessionId}`);
        console.error(`   Session metadata: ${JSON.stringify(session.metadata)}`);
        return res.json({ hasSubscription: false, error: "No tier in session", metadata: session.metadata });
      }

      console.log(`✅ Verify session: Complete session found with tier ${tier}`);

      const tierInfo = getPlayerSubscriptionTier(tier);

      try {
        const subscription = await storage.createMembershipSubscription({
          playerId: player.id,
          tier,
          status: "active",
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: session.customer as string || null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          monthlyPrice: tierInfo?.monthlyPrice || 0,
          perks: tierInfo?.perks || [],
          commissionRate: tierInfo?.commissionRate || 1000,
        });
        console.log(`✅ Created membership subscription: id=${subscription.id} player=${player.id} tier=${tier}`);

        await storage.updatePlayer(player.id, { member: true });
        console.log(`✅ Updated player.member = true for player ${player.id}`);
      } catch (dbErr: any) {
        if (dbErr?.code === "23505" || dbErr?.message?.includes("unique") || dbErr?.message?.includes("duplicate")) {
          console.log(`⚠️ Duplicate subscription insert for player ${player.id} — checking existing record`);
          const existingAfterInsert = await storage.getMembershipSubscriptionByPlayerId(player.id);
          if (existingAfterInsert) {
            return res.json({
              hasSubscription: true,
              tier: existingAfterInsert.tier,
              status: existingAfterInsert.status,
              tierInfo: getPlayerSubscriptionTier(existingAfterInsert.tier),
            });
          }
        }
        console.error(`❌ Database error creating subscription:`, dbErr);
        throw dbErr;
      }

      console.log(`✅ Verified and created subscription for player ${player.id} tier ${tier}`);

      res.json({
        hasSubscription: true,
        tier,
        status: "active",
        tierInfo,
      });

    } catch (error: any) {
      console.error(`❌ Verify session error:`, error.message || error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // Cancel player subscription
  app.post("/api/player-billing/cancel", requireAnyAuth, async (req, res) => {
    try {
      // Get authenticated user ID from session
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const subscription = await storage.getMembershipSubscriptionByPlayerId(player.id);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database
      await storage.updateMembershipSubscription(subscription.id, {
        cancelAtPeriodEnd: true
      });

      res.json({ success: true, message: "Subscription will cancel at the end of the current period" });

    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reactivate cancelled subscription
  app.post("/api/player-billing/reactivate", requireAnyAuth, async (req, res) => {
    try {
      // Get authenticated user ID from session
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const player = await storage.getPlayerByUserId(userId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const subscription = await storage.getMembershipSubscriptionByPlayerId(player.id);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      // Reactivate in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update our database
      await storage.updateMembershipSubscription(subscription.id, {
        cancelAtPeriodEnd: false
      });

      res.json({ success: true, message: "Subscription reactivated successfully" });

    } catch (error: any) {
      console.error("Reactivate subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Player billing portal (manage subscription, payment methods, etc.)
  app.post("/api/player-billing/portal", requireAnyAuth, async (req, res) => {
    try {
      // Get authenticated user ID from session
      const userId = (req as any).dbUser.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "No customer account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appBaseUrl}/app?tab=dashboard`
      });

      res.json({ url: session.url });

    } catch (error: any) {
      console.error("Billing portal error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}