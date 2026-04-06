import { Request, Response } from "express";
import Stripe from "stripe";
import { IStorage } from "../storage";
import { insertCharityEventSchema, insertBountySchema, insertAddedMoneyFundSchema } from "@shared/schema";
import { createSafeCheckoutSession } from "../utils/stripeSafe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

// Stripe Price IDs for charity donations
const prices = {
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

// ==================== CHARITY EVENT CONTROLLERS ====================

export function getCharityEvents(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const events = await storage.getCharityEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createCharityEvent(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertCharityEventSchema.parse(req.body);
      const event = await storage.createCharityEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateCharityEvent(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const event = await storage.updateCharityEvent(id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Charity event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function createCharityDonation(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { charityEventId, amount, donorEmail } = req.body;
      
      if (!charityEventId || !amount || amount < 5) {
        return res.status(400).json({ message: "Event ID and minimum $5 donation required" });
      }

      const charityEvent = await storage.getCharityEvent(charityEventId);
      if (!charityEvent) {
        return res.status(404).json({ message: "Charity event not found" });
      }

      let priceId = (prices.charity_donations as any)[amount.toString()];
      
      if (!priceId) {
        const customPrice = await stripe.prices.create({
          currency: "usd",
          unit_amount: amount * 100,
          product: prices.charity_product,
          metadata: {
            type: "charity_donation",
            custom_amount: amount.toString(),
            charity_event_id: charityEventId
          }
        });
        priceId = customPrice.id;
      }

      const session = await createSafeCheckoutSession({
        mode: "payment",
        customer_email: donorEmail || undefined,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${process.env.APP_URL || 'http://localhost:5000'}/charity/success?session_id={CHECKOUT_SESSION_ID}&event_id=${charityEventId}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/charity`,
        metadata: {
          type: "charity_donation",
          charity_event_id: charityEventId,
          amount: amount.toString(),
          event_name: charityEvent.name
        },
        payment_intent_data: {
          metadata: {
            type: "charity_donation",
            charity_event_id: charityEventId,
            amount: amount.toString()
          }
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Charity donation error:", error);
      res.status(500).json({ message: "Error creating donation checkout: " + error.message });
    }
  };
}

// ==================== BOUNTY CONTROLLERS ====================

export function getBounties(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const bounties = await storage.getBounties();
      res.json(bounties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createBounty(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertBountySchema.parse(req.body);
      const bounty = await storage.createBounty(validatedData);
      res.status(201).json(bounty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateBounty(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bounty = await storage.updateBounty(id, req.body);
      if (!bounty) {
        return res.status(404).json({ message: "Bounty not found" });
      }
      res.json(bounty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

// ==================== ADDED MONEY FUND CONTROLLERS ====================

export function getAddedMoneyFunds(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const funds = await storage.getAddedMoneyFunds();
      res.json(funds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getAddedMoneyFundsBySource(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { sourceType } = req.params;
      const funds = await storage.getAddedMoneyFundsBySource(sourceType);
      res.json(funds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createAddedMoneyFund(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertAddedMoneyFundSchema.parse(req.body);
      const fund = await storage.createAddedMoneyFund(validatedData);
      res.status(201).json(fund);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

// ==================== JACKPOT CONTROLLER ====================

export function getJackpot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const matches = await storage.getAllMatches();
      const totalStakes = matches
        .filter(m => m.status === "reported")
        .reduce((sum, m) => sum + (m.stake || 0), 0);
      
      const jackpotAmount = Math.floor(totalStakes * 0.02);
      const nextDrawDate = new Date();
      nextDrawDate.setDate(nextDrawDate.getDate() + 30);
      
      res.json({
        amount: jackpotAmount,
        nextDrawDate,
        contributingMatches: matches.filter(m => m.status === "reported").length,
        description: "2% of all match stakes goes to monthly jackpot draw"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
