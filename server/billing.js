require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const {
  upsertUser,
  getStripeCustomerIdForUser,
  setStripeIds,
  setMembership,
  getMembershipStatus,
  getEntry,
  recordTournamentEntry,
  listMembers,
  membersToCSV,
  addPoolHall,
  getPoolHalls,
  updatePoolHallStats,
  getMaxPlayersForRole,
  getPriceForRole,
  upsertTournament,
  getTournament,
  setTournamentOpen,
  countConfirmedEntries,
  listEntries,
  setOperatorLicense,
  getOperatorLicense,
  setHallPrice,
  getHallPrice,
  setHallSetting,
  getHallSetting,
  addToWaitlist,
  listWaitlist,
  nextWaitlistRow,
  markWaitlistOffered,
  markWaitlistConverted,
  cancelWaitlist,
  saveContact,
  listContacts,
  revenueSummaryByHall,
  revenueDetail,
  listTournaments,
  listOperatorLicenses
} = require("./db");

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: true }));
app.use("/api", express.json()); // JSON for normal API routes

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

// Environment variables for pricing
const TOURNAMENT_BASIC_USD = Number(process.env.TOURNAMENT_BASIC_USD || 25);
const TOURNAMENT_NONMEMBER_USD = Number(process.env.TOURNAMENT_NONMEMBER_USD || 30);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const INVITE_TTL_HOURS = Number(process.env.INVITE_TTL_HOURS || 168);
const WAITLIST_OFFER_TTL_HOURS = Number(process.env.WAITLIST_OFFER_TTL_HOURS || 12);
const DEFAULT_SPLIT = Math.max(0, Math.min(1, Number(process.env.OPERATOR_TOURNAMENT_SPLIT_PCT || 0.5)));
const crypto = require("crypto");

function epochNow() { return Math.floor(Date.now() / 1000); }
function epochPlusHours(h) { return epochNow() + Math.round(h * 3600); }
function makeToken() { return crypto.randomBytes(24).toString("hex"); }

// Admin auth helper
function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!ADMIN_API_KEY || key === ADMIN_API_KEY) return next();
  return res.status(401).json({ error: "unauthorized" });
}

// Helper to get subscription tier based on player count
function getSubscriptionTier(playerCount) {
  if (playerCount <= 15) {
    return {
      tier: "small",
      name: "Small Hall / Starter",
      price: 199,
      priceId: process.env.SMALL_PRICE_ID || "price_1THmiLDvTG8XWAaKhXE4JvZq",
      perks: [
        "Up to 15 active players",
        "Full ladder management system",
        "Basic analytics dashboard", 
        "Email + chat support"
      ]
    };
  } else if (playerCount <= 25) {
    return {
      tier: "medium",
      name: "Medium Hall",
      price: 299,
      priceId: process.env.MEDIUM_PRICE_ID || "price_1THmiPDvTG8XWAaKkeveuEqq",
      perks: [
        "Up to 25 active players",
        "Full ladder management system",
        "Advanced analytics",
        "Priority support"
      ]
    };
  } else if (playerCount <= 40) {
    return {
      tier: "large",
      name: "Large Hall",
      price: 399,
      priceId: process.env.LARGE_PRICE_ID || "price_1THmiRDvTG8XWAaK39Gg3Nb9",
      perks: [
        "Up to 40 active players",
        "Full ladder management system",
        "Advanced analytics + operator ROI reports",
        "Priority support + training"
      ]
    };
  } else {
    return {
      tier: "mega",
      name: "Mega Hall / Multi-Location",
      price: 799,
      priceId: process.env.MEGA_PRICE_ID || "price_1THmiUDvTG8XWAaKa43Y9Bm9",
      perks: [
        "Unlimited players",
        "Full ladder management system",
        "Multi-hall dashboard",
        "White-label branding options",
        "Dedicated account rep"
      ]
    };
  }
}

// Helper to compute tournament fee with hall overrides
function computeTournamentFeeCents(role, hallId) {
  // Check per-hall overrides (USD -> cents)
  const basicUSD = hallId ? Number(getHallPrice(hallId, "tournament_basic_usd")) : NaN;
  const nonmemUSD = hallId ? Number(getHallPrice(hallId, "tournament_nonmember_usd")) : NaN;

  if (["large", "mega"].includes(role)) return 0; // Free for large/mega tiers
  if (["small", "medium"].includes(role)) {
    const usd = Number.isFinite(basicUSD) ? basicUSD : TOURNAMENT_BASIC_USD;
    return Math.round(usd * 100);
  }
  const usd = Number.isFinite(nonmemUSD) ? nonmemUSD : TOURNAMENT_NONMEMBER_USD;
  return Math.round(usd * 100);
}

// Create subscription checkout session
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const { playerCount, hallId, operatorId, email } = req.body || {};
    if (!hallId || !operatorId) return res.status(400).json({ error: "hallId and operatorId required" });

    const subscription = getSubscriptionTier(Number(playerCount) || 1);
    const existingCustomer = await getStripeCustomerIdForUser(operatorId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(existingCustomer
        ? { customer: existingCustomer }
        : { customer_email: email }),
      line_items: [{ price: subscription.priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing/cancel`,
      client_reference_id: operatorId,
      subscription_data: {
        metadata: { hallId, operatorId, tier: subscription.tier, playerCount: String(playerCount) },
      },
      metadata: { hallId, operatorId, tier: subscription.tier, playerCount: String(playerCount) },
    });

    res.json({ url: session.url, tier: subscription.name });
  } catch (e) {
    console.error("Checkout error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Customer portal for billing management
app.post("/api/billing/portal", async (req, res) => {
  try {
    const { customerId } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "customerId required" });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("Portal error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Tournament entry payment with capacity checking and waitlist
app.post("/api/tournaments/entry", async (req, res) => {
  try {
    const { userId, tournamentId, userEmail, joinWaitlistIfFull } = req.body || {};
    if (!userId || !tournamentId) return res.status(400).json({ error: "userId and tournamentId required" });

    let t = await getTournament(tournamentId);
    if (!t) {
      await upsertTournament({ 
        id: tournamentId, 
        max_slots: Number(process.env.TOURNAMENT_DEFAULT_CAP) || 32, 
        is_open: 1 
      });
      t = await getTournament(tournamentId);
    }

    const already = await getEntry(tournamentId, userId);
    if (already) return res.json({ alreadyRegistered: true, entry: already });

    // Capacity check
    const current = await countConfirmedEntries(tournamentId);
    if (!t.is_open || current >= t.max_slots) {
      await setTournamentOpen(tournamentId, false);
      if (joinWaitlistIfFull) {
        const row = addToWaitlist({ tournamentId, userId });
        return res.status(202).json({ waitlisted: true, row });
      }
      return res.status(409).json({ 
        capacity_full: true, 
        maxSlots: t.max_slots, 
        current, 
        waitlistAvailable: true 
      });
    }

    const status = await getMembershipStatus(userId);
    const amountCents = computeTournamentFeeCents(status?.role || "nonmember", t.hall_id || null);

    if (amountCents === 0) {
      // Comped for Large/Mega tiers
      const entry = await recordTournamentEntry({ 
        tournamentId, 
        userId, 
        amountCents: 0, 
        status: "comped" 
      });
      const newCount = await countConfirmedEntries(tournamentId);
      if (newCount >= t.max_slots) await setTournamentOpen(tournamentId, false);
      return res.json({ comped: true, entry });
    }

    // Charge via Checkout (one-off payment)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail || status?.email || undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Tournament Entry – ${tournamentId}`,
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/tournaments/${tournamentId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/tournaments/${tournamentId}/cancel`,
      client_reference_id: `${userId}:${tournamentId}`,
      metadata: {
        type: "tournament_entry",
        userId,
        tournamentId,
        amountCents: String(amountCents),
      },
      payment_intent_data: {
        metadata: {
          type: "tournament_entry",
          userId,
          tournamentId,
        },
      },
      allow_promotion_codes: false,
    });

    res.json({ url: session.url, amountCents });
  } catch (e) {
    console.error("Tournament entry error:", e);
    res.status(400).json({ error: e.message });
  }
});

// User management endpoints
app.post("/api/users/upsert", async (req, res) => {
  const { id, email, displayName } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  await upsertUser({ id, email, display_name: displayName });
  res.json({ ok: true });
});

app.get("/api/membership/status", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const status = await getMembershipStatus(userId);
  res.json(status || { userId, role: "nonmember", status: "none" });
});

// Admin endpoints
app.get("/api/admin/members", requireAdmin, async (req, res) => {
  const { role, status } = req.query;
  const rows = await listMembers({ role, status });
  res.json({ count: rows.length, rows });
});

app.get("/api/admin/members.csv", requireAdmin, async (req, res) => {
  const { role, status } = req.query;
  const rows = await listMembers({ role, status });
  const csv = membersToCSV(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=members.csv");
  res.send(csv);
});

// Pool hall management
app.post("/api/poolhalls", async (req, res) => {
  try {
    const { name, city } = req.body || {};
    if (!name || !city) return res.status(400).json({ error: "name and city required" });
    
    const hall = await addPoolHall({ name, city });
    res.json(hall);
  } catch (e) {
    console.error("Add poolhall error:", e);
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/poolhalls", async (req, res) => {
  try {
    const halls = await getPoolHalls();
    res.json(halls);
  } catch (e) {
    console.error("Get poolhalls error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Stripe webhook handling
app.post(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️  Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const sess = event.data.object;

          // Tournament one-off payments
          if (sess.mode === "payment" && (sess.metadata?.type === "tournament_entry")) {
            const userId = sess.metadata.userId;
            const tournamentId = sess.metadata.tournamentId;
            const amountCents = Number(sess.metadata.amountCents || 0);
            const paymentIntentId = sess.payment_intent || null;

            await recordTournamentEntry({
              tournamentId,
              userId,
              amountCents,
              status: "paid",
              paymentIntentId,
            });
            break;
          }

          // Subscription checkouts (operator tiers)
          if (sess.mode === "subscription") {
            const operatorId = sess.client_reference_id || sess.metadata?.operatorId;
            const tier = sess.metadata?.tier || "small";
            const subscriptionId = sess.subscription || undefined;

            await setStripeIds(operatorId, { 
              customerId: sess.customer, 
              subscriptionId 
            });
            await setMembership(operatorId, tier, "active", undefined, {
              customer: sess.customer,
              sub: subscriptionId,
            });
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object;
          const status = sub.status;
          const operatorId = sub.metadata?.operatorId || null;
          
          let tier = "small";
          if (sub.metadata?.tier) tier = sub.metadata.tier;

          if (operatorId) {
            await setMembership(operatorId, tier, status, sub.current_period_end, {
              customer: sub.customer,
              sub: sub.id,
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const operatorId = sub.metadata?.operatorId;
          if (operatorId) {
            await setMembership(operatorId, "small", "canceled", sub.current_period_end, {
              sub: sub.id,
            });
          }
          break;
        }

        case "invoice.payment_failed": {
          const inv = event.data.object;
          const operatorId = inv.metadata?.operatorId;
          if (operatorId) await setMembership(operatorId, "small", "past_due");
          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (e) {
      console.error("Webhook handler error:", e);
      res.status(500).send("Webhook failure");
    }
  }
);

// Simple success/cancel routes for testing
app.get("/billing/success", (req, res) =>
  res.send(`
    <h1>Payment Successful!</h1>
    <p>Thank you for your subscription to Action Ladder Billiards.</p>
    <p><a href="/">Return to Dashboard</a></p>
  `)
);
app.get("/billing/cancel", (req, res) => 
  res.send(`
    <h1>Payment Canceled</h1>
    <p>Your payment was canceled. You can try again anytime.</p>
    <p><a href="/">Return to Dashboard</a></p>
  `)
);

// Waitlist management
app.post("/api/tournaments/waitlist", (req, res) => {
  const { userId, tournamentId } = req.body || {};
  if (!userId || !tournamentId) return res.status(400).json({ error: "userId and tournamentId required" });
  const row = addToWaitlist({ tournamentId, userId });
  res.json({ ok: true, row });
});

// Contact form submission
app.post("/api/contact", (req, res) => {
  const { fromEmail, subject, body } = req.body || {};
  if (!fromEmail || !body) return res.status(400).json({ error: "fromEmail and body required" });
  const msg = saveContact({ fromEmail, subject, body });
  res.json({ ok: true, message: msg });
});

// Admin contact view
app.get("/api/admin/contact", requireAdmin, (req, res) => {
  res.json({ rows: listContacts() });
});

// Revenue reporting with CSV export
app.get("/api/admin/revenue.csv", requireAdmin, (req, res) => {
  const { from, to, hallId, detail } = req.query;
  const fromEpoch = Math.floor(new Date(from || (new Date(Date.now()-30*864e5))).getTime()/1000);
  const toEpoch = Math.floor(new Date(to || new Date()).getTime()/1000);

  if (detail === '1') {
    const rows = revenueDetail({ hallId: hallId || null, fromEpoch, toEpoch });
    const hdr = ["tournament_id","user_id","amount_cents","amount_usd","created_at","hall_id"];
    const out = [hdr.join(",")];
    for (const r of rows) {
      const t = getTournament(r.tournament_id);
      out.push([
        r.tournament_id, 
        r.user_id, 
        r.amount_cents, 
        (r.amount_cents/100).toFixed(2), 
        new Date(r.created_at*1000).toISOString(), 
        (t?.hall_id||"")
      ].join(","));
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=revenue_detail.csv");
    return res.send(out.join("\n"));
  }

  const rows = revenueSummaryByHall({ fromEpoch, toEpoch });
  const hdr = ["hall_id","paid_count","gross_cents","gross_usd","operator_pct","operator_share_usd","platform_share_usd"];
  const out = [hdr.join(",")];
  for (const r of rows) {
    const hs = r.hall_id ? getHallSetting(r.hall_id) : null;
    const pct = (hs?.revenue_split_pct != null ? hs.revenue_split_pct : DEFAULT_SPLIT);
    const operatorUSD = ((r.gross_cents || 0)/100) * pct;
    const grossUSD = (r.gross_cents || 0)/100;
    const platformUSD = grossUSD - operatorUSD;
    out.push([
      r.hall_id || "", 
      r.paid_count || 0, 
      r.gross_cents || 0, 
      grossUSD.toFixed(2), 
      pct.toFixed(2), 
      operatorUSD.toFixed(2), 
      platformUSD.toFixed(2)
    ].join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=revenue_by_hall.csv");
  res.send(out.join("\n"));
});

// Promote next from waitlist function
async function promoteNextFromWaitlist(tournamentId) {
  const t = await getTournament(tournamentId);
  if (!t) return { ok:false, reason:"tournament_missing" };
  
  const current = await countConfirmedEntries(tournamentId);
  if (current >= t.max_slots) return { ok:false, reason:"still_full" };

  const row = nextWaitlistRow(tournamentId);
  if (!row) return { ok:false, reason:"no_waitlist" };

  const status = await getMembershipStatus(row.user_id);
  const amountCents = computeTournamentFeeCents(status?.role || "nonmember", t.hall_id || null);

  if (amountCents === 0) {
    // Comped promotion — auto convert
    await recordTournamentEntry({ 
      tournamentId, 
      userId: row.user_id, 
      amountCents: 0, 
      status: "comped" 
    });
    markWaitlistConverted(row.id);
    
    const nowCount = await countConfirmedEntries(tournamentId);
    if (nowCount >= t.max_slots) await setTournamentOpen(tournamentId, false);
    return { ok:true, promoted:"comped", userId: row.user_id };
  }

  // Create one-off Checkout for them and store the link
  const offerUrlTtl = epochPlusHours(WAITLIST_OFFER_TTL_HOURS);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: status?.email || undefined,
    line_items: [{
      price_data: { 
        currency: "usd", 
        unit_amount: amountCents, 
        product_data: { name: `Tournament Entry (Offer) – ${tournamentId}` } 
      },
      quantity: 1,
    }],
    success_url: `${process.env.APP_URL || 'http://localhost:3000'}/tournaments/${tournamentId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/tournaments/${tournamentId}/cancel`,
    client_reference_id: `${row.user_id}:${tournamentId}`,
    metadata: { 
      type: "tournament_entry", 
      userId: row.user_id, 
      tournamentId, 
      amountCents: String(amountCents), 
      waitlist: "1" 
    },
    payment_intent_data: { 
      metadata: { 
        type: "tournament_entry", 
        userId: row.user_id, 
        tournamentId, 
        waitlist: "1" 
      } 
    },
    allow_promotion_codes: false,
  });

  markWaitlistOffered(row.id, { url: session.url, expiresAt: offerUrlTtl });
  await setTournamentOpen(tournamentId, true);
  return { ok:true, promoted:"offered", userId: row.user_id, url: session.url, expiresAt: offerUrlTtl };
}

// Admin promote next from waitlist
app.post("/api/admin/tournaments/:id/offer-next", requireAdmin, async (req, res) => {
  const promo = await promoteNextFromWaitlist(req.params.id);
  res.json(promo);
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Action Ladder Billing Server listening on ${port}`));

module.exports = app;