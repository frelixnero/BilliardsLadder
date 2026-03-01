import { Request, Response } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { 
  insertMatchSchema, 
  insertTournamentSchema,
  insertTournamentCalcuttaSchema,
  insertCalcuttaBidSchema,
  insertMatchDivisionSchema,
  insertMatchEntrySchema,
  insertPayoutDistributionSchema
} from "@shared/schema";
import { createStripeDescription } from "../utils/sanitize";
import { emailService } from "../services/email-service";

export function getMatches(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const match = await storage.updateMatch(id, req.body);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getTournaments(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createTournament(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateTournament(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tournament = await storage.updateTournament(id, req.body);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getTournamentCalcuttas(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const calcuttas = await storage.getTournamentCalcuttas();
      res.json(calcuttas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getTournamentCalcuttasByTournament(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { tournamentId } = req.params;
      const calcuttas = await storage.getTournamentCalcuttasByTournament(tournamentId);
      res.json(calcuttas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createTournamentCalcutta(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertTournamentCalcuttaSchema.parse(req.body);
      const calcutta = await storage.createTournamentCalcutta(validatedData);
      res.status(201).json(calcutta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateTournamentCalcutta(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const calcutta = await storage.updateTournamentCalcutta(id, req.body);
      if (!calcutta) {
        return res.status(404).json({ message: "Tournament calcutta not found" });
      }
      res.json(calcutta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getCalcuttaBids(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const bids = await storage.getCalcuttaBids();
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getCalcuttaBidsByCalcutta(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { calcuttaId } = req.params;
      const bids = await storage.getCalcuttaBidsByCalcutta(calcuttaId);
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createCalcuttaBid(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertCalcuttaBidSchema.parse(req.body);
      const bid = await storage.createCalcuttaBid(validatedData);
      
      await storage.updateTournamentCalcutta(bid.calcuttaId, {
        currentBid: bid.bidAmount,
        currentBidderId: bid.bidderId,
        totalBids: (await storage.getCalcuttaBidsByCalcutta(bid.calcuttaId)).length
      });
      
      res.status(201).json(bid);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getMatchDivisions(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const divisions = await storage.getMatchDivisions();
      res.json(divisions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getMatchDivision(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const division = await storage.getMatchDivision(id);
      if (!division) {
        return res.status(404).json({ message: "Match division not found" });
      }
      res.json(division);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createMatchEntry(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { 
        divisionId, 
        homeTeamId, 
        awayTeamId, 
        entryFeePerPlayer, 
        teamSize,
        operatorId,
        venueId,
        scheduledAt 
      } = req.body;

      const division = await storage.getMatchDivision(divisionId);
      if (!division) {
        return res.status(400).json({ message: "Invalid division" });
      }

      if (entryFeePerPlayer < division.entryFeeMin || entryFeePerPlayer > division.entryFeeMax) {
        return res.status(400).json({ 
          message: `Entry fee must be between $${(division.entryFeeMin/100).toFixed(2)} and $${(division.entryFeeMax/100).toFixed(2)} per player` 
        });
      }

      if (teamSize < division.minTeamSize || teamSize > division.maxTeamSize) {
        return res.status(400).json({ 
          message: `Team size must be between ${division.minTeamSize} and ${division.maxTeamSize} players` 
        });
      }

      const totalStake = entryFeePerPlayer * teamSize * 2;
      const matchId = `${division.name}_${Date.now()}_${homeTeamId}`;

      const operatorTiers = await storage.getOperatorTiers();
      const defaultTier = operatorTiers.find(t => t.name === "basic_hall") || operatorTiers[0];
      const revenueSplitPercent = defaultTier?.revenueSplitPercent || 10;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${division.displayName} Tournament Entry`,
                description: createStripeDescription(`Tournament entry for ${teamSize} players at $${(entryFeePerPlayer/100).toFixed(2)} each`),
              },
              unit_amount: totalStake,
            },
            quantity: 1,
          },
        ],
        metadata: {
          match_id: matchId,
          division_id: divisionId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId || "",
          entry_fee_per_player: entryFeePerPlayer.toString(),
          team_size: teamSize.toString(),
          operator_id: operatorId,
          venue_id: venueId || "",
          revenue_split_percent: revenueSplitPercent.toString(),
        },
        success_url: `${req.protocol}://${req.get('host')}/app?tab=escrow-challenges&success=payment-complete&match_id=${matchId}`,
        cancel_url: `${req.protocol}://${req.get('host')}/app?tab=escrow-challenges&cancelled=true`,
      });

      const matchEntry = await storage.createMatchEntry({
        matchId,
        divisionId,
        homeTeamId,
        awayTeamId,
        entryFeePerPlayer,
        totalStake,
        stripeCheckoutSessionId: session.id,
        paymentStatus: "pending",
        matchStatus: awayTeamId ? "accepted" : "open",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        venueId,
        operatorId,
        metadata: {
          teamSize,
          revenueSplitPercent,
          divisionName: division.name,
        },
      });

      res.status(201).json({
        matchEntry,
        checkoutUrl: session.url,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getMatchEntry(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const matchEntry = await storage.getMatchEntry(id);
      if (!matchEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }
      res.json(matchEntry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function updateMatchEntry(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedEntry = await storage.updateMatchEntry(id, updates);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function completeMatchEntry(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { winnerId, homeScore, awayScore } = req.body;

      const matchEntry = await storage.getMatchEntry(id);
      if (!matchEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }

      if (matchEntry.matchStatus === "completed") {
        return res.status(400).json({ message: "Match already completed" });
      }

      if (matchEntry.paymentStatus !== "paid") {
        return res.status(400).json({ message: "Match entry fees not paid" });
      }

      const completedMatch = await storage.updateMatchEntry(id, {
        matchStatus: "completed",
        winnerId,
        homeScore,
        awayScore,
        completedAt: new Date(),
      });

      const teamStripeAccount = await storage.getTeamStripeAccount(winnerId);
      if (!teamStripeAccount || !teamStripeAccount.payoutsEnabled) {
        return res.json({
          match: completedMatch,
          payout: null,
          message: "Match completed but winning team needs to complete Stripe onboarding for payout",
        });
      }

      const totalStake = matchEntry.totalStake;
      const metadata = matchEntry.metadata as any;
      const revenueSplitPercent = metadata?.revenueSplitPercent || 10;
      
      const platformFee = Math.floor(totalStake * (revenueSplitPercent / 100));
      const operatorFee = 0;
      const teamPayout = totalStake - platformFee - operatorFee;

      const transfer = await stripe.transfers.create({
        amount: teamPayout,
        currency: 'usd',
        destination: teamStripeAccount.stripeAccountId,
        transfer_group: `match_${matchEntry.matchId}`,
        metadata: {
          match_id: matchEntry.matchId,
          winning_team_id: winnerId,
          total_stake: totalStake.toString(),
          platform_fee: platformFee.toString(),
        },
      });

      const payout = await storage.createPayoutDistribution({
        matchEntryId: matchEntry.id,
        winningTeamId: winnerId,
        totalPayout: teamPayout,
        platformFee,
        operatorFee,
        teamPayout,
        stripeTransferId: transfer.id,
        transferStatus: "pending",
        operatorTierAtPayout: "basic_hall",
        revenueSplitAtPayout: revenueSplitPercent,
        payoutMethod: "stripe_transfer",
      });

      if (teamStripeAccount.email) {
        try {
          const division = await storage.getMatchDivision(matchEntry.divisionId);
          await emailService.sendPayoutNotification({
            teamName: `Winning Team ${winnerId}`,
            matchId: matchEntry.matchId,
            division: division?.displayName || matchEntry.divisionId,
            amount: teamPayout,
            transferId: transfer.id,
            opponentTeam: matchEntry.awayTeamId ? `Opponent Team ${matchEntry.awayTeamId}` : undefined,
          }, teamStripeAccount.email);
        } catch (emailError) {
          console.error('Failed to send payout email:', emailError);
        }
      }

      res.json({
        match: completedMatch,
        payout,
        transfer: {
          id: transfer.id,
          amount: teamPayout,
          status: transfer.reversals ? "reversed" : "pending",
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
