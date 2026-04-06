import { Request, Response } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

const prices = {
  rookie_monthly: "price_1THmhwDvTG8XWAaKP5IdXAic",
};

export function getAllRookieMatches(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const matches = await storage.getAllRookieMatches();
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRookieMatchesByPlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const matches = await storage.getRookieMatchesByPlayer(req.params.playerId);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createRookieMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const match = await storage.createRookieMatch(req.body);
      res.json(match);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function completeRookieMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { winner } = req.body;
      
      const match = await storage.updateRookieMatch(id, {
        status: "completed",
        winner,
        reportedAt: new Date(),
      });

      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const pointsForWin = 10;
      const pointsForLoss = 5;
      
      const winnerPlayer = await storage.getPlayer(winner);
      const loserPlayerId = match.challenger === winner ? match.opponent : match.challenger;
      const loserPlayer = await storage.getPlayer(loserPlayerId);

      if (winnerPlayer && winnerPlayer.isRookie) {
        await storage.updatePlayer(winner, {
          rookieWins: (winnerPlayer.rookieWins || 0) + 1,
          rookiePoints: (winnerPlayer.rookiePoints || 0) + pointsForWin,
          rookieStreak: (winnerPlayer.rookieStreak || 0) + 1,
        });

        const newRookiePoints = (winnerPlayer.rookiePoints || 0) + pointsForWin;
        if (newRookiePoints >= 100) {
          await storage.promoteRookieToMainLadder(winner);
        }

        if ((winnerPlayer.rookieWins || 0) === 0) {
          await storage.createRookieAchievement({
            playerId: winner,
            type: "first_win",
            title: "First Rookie Win",
            description: "Won your first rookie match",
            badge: "🥇",
          });
        }

        if ((winnerPlayer.rookieStreak || 0) + 1 === 3) {
          await storage.createRookieAchievement({
            playerId: winner,
            type: "streak_3",
            title: "3-Win Streak",
            description: "Won 3 rookie matches in a row",
            badge: "🔥",
          });
        }
      }

      if (loserPlayer && loserPlayer.isRookie) {
        await storage.updatePlayer(loserPlayerId, {
          rookieLosses: (loserPlayer.rookieLosses || 0) + 1,
          rookiePoints: (loserPlayer.rookiePoints || 0) + pointsForLoss,
          rookieStreak: 0,
        });
      }

      res.json(match);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getAllRookieEvents(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllRookieEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createRookieEvent(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const event = await storage.createRookieEvent(req.body);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRookieLeaderboard(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const leaderboard = await storage.getRookieLeaderboard();
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRookieAchievements(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getRookieAchievementsByPlayer(req.params.playerId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRookieSubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const subscription = await storage.getRookieSubscription(req.params.playerId);
      res.json(subscription || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createRookieSubscription(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.body;
      
      if (!playerId) {
        return res.status(400).json({ message: "Player ID is required" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price: prices.rookie_monthly,
          quantity: 1,
        }],
        success_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/?rookie_subscription=success`,
        cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/?rookie_subscription=cancelled`,
        metadata: {
          playerId,
          subscriptionType: 'rookie_pass'
        },
        allow_promotion_codes: true,
        automatic_tax: { enabled: false },
      });

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
