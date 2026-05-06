import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertCheckinSchema } from "@shared/schema";
import { sanitizeBody } from "../utils/sanitize";

export function createCheckin(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertCheckinSchema.parse(req.body);
      const checkin = await storage.checkinUser(validatedData);
      res.status(201).json(checkin);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getCheckinsBySession(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const checkins = await storage.getCheckinsBySession(sessionId);
      res.json(checkins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getCheckinsByVenue(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { venueId } = req.params;
      const checkins = await storage.getCheckinsByVenue(venueId);
      res.json(checkins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createAttitudeVote(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { targetUserId, sessionId, venueId, endsInSec = 90 } = req.body;
      
      const canVote = await storage.canUserBeVotedOn(targetUserId, sessionId);
      if (!canVote) {
        return res.status(400).json({ 
          message: "User cannot be voted on at this time (cooldown or already ejected)" 
        });
      }

      const isImmune = await storage.isUserImmune(targetUserId, sessionId);
      if (isImmune) {
        return res.status(400).json({ 
          message: "User is immune while shooting. Wait until their turn ends." 
        });
      }

      const activeCheckins = await storage.getActiveCheckins(sessionId, venueId);
      const totalEligibleWeight = activeCheckins.reduce((sum, checkin) => {
        let weight = 0.5;
        if (checkin.role === "player") weight = 1.0;
        if (checkin.role === "operator") weight = 2.0;
        return sum + weight;
      }, 0);

      const minQuorum = Math.max(12.0, totalEligibleWeight * 0.3);
      const endsAt = new Date(Date.now() + endsInSec * 1000);

      const voteData = {
        targetUserId,
        sessionId,
        venueId,
        endsAt,
        quorumRequired: minQuorum,
        thresholdRequired: 0.65,
        createdBy: req.body.createdBy || "system",
      };

      const vote = await storage.createAttitudeVote(voteData);
      res.status(201).json(vote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getAttitudeVote(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vote = await storage.getAttitudeVote(id);
      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }

      const now = new Date();
      const remainingMs = vote.endsAt.getTime() - now.getTime();
      const hasEnded = remainingMs <= 0;

      if (hasEnded && vote.status === "open") {
        const weights = await storage.calculateVoteWeights(id);
        const quorumMet = await storage.checkVoteQuorum(id);
        
        let result = "fail_quorum";
        if (quorumMet) {
          const passThreshold = weights.outWeight / weights.totalWeight >= vote.thresholdRequired;
          result = passThreshold ? "pass" : "fail_threshold";
        }
        
        const updatedVote = await storage.closeAttitudeVote(id, result);
        
        if (result === "pass" && updatedVote) {
          await storage.createIncident({
            userId: vote.targetUserId,
            sessionId: vote.sessionId,
            venueId: vote.venueId,
            type: "ejection",
            details: "Ejected by community vote",
            consequence: "ejected_night",
            pointsPenalty: 10,
            creditsFine: 0,
            createdBy: "system",
            voteId: id,
          });
        }
        
        return res.json(updatedVote);
      }

      const userId = req.query.userId as string;
      let youVoted = false;
      if (userId) {
        youVoted = await storage.hasUserVoted(id, userId);
      }

      res.json({
        ...vote,
        remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
        youVoted,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function castVote(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { choice, tags, note, voterUserId, voterRole } = req.body;

      if (!["out", "keep"].includes(choice)) {
        return res.status(400).json({ message: "Choice must be 'out' or 'keep'" });
      }

      const vote = await storage.getAttitudeVote(id);
      if (!vote || vote.status !== "open") {
        return res.status(400).json({ message: "Vote is not open" });
      }

      if (new Date() > vote.endsAt) {
        return res.status(400).json({ message: "Vote has expired" });
      }

      const hasVoted = await storage.hasUserVoted(id, voterUserId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted" });
      }

      let weight = 0.5;
      if (voterRole === "player") weight = 1.0;
      if (voterRole === "operator") weight = 2.0;

      if (note && note.length > 140) {
        return res.status(400).json({ message: "Note must be 140 characters or less" });
      }

      const ballotData = {
        voteId: id,
        voterUserId,
        weight,
        choice,
        tags: tags || [],
        note: note || undefined,
      };

      const ballot = await storage.createAttitudeBallot(ballotData);
      res.status(201).json(ballot);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function closeAttitudeVote(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const vote = await storage.getAttitudeVote(id);
      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }

      const weights = await storage.calculateVoteWeights(id);
      const quorumMet = await storage.checkVoteQuorum(id);
      
      let result = "fail_quorum";
      if (quorumMet) {
        const passThreshold = weights.outWeight / weights.totalWeight >= vote.thresholdRequired;
        result = passThreshold ? "pass" : "fail_threshold";
      }

      const closedVote = await storage.closeAttitudeVote(id, result);
      
      if (result === "pass" && closedVote) {
        await storage.createIncident({
          userId: vote.targetUserId,
          sessionId: vote.sessionId,
          venueId: vote.venueId,
          type: "ejection",
          details: "Ejected by community vote",
          consequence: "ejected_night",
          pointsPenalty: 10,
          creditsFine: 0,
          createdBy: req.body.operatorId || "system",
          voteId: id,
        });
      }

      res.json(closedVote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getActiveVotes(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { sessionId, venueId } = req.params;
      const activeVotes = await storage.getActiveVotes(sessionId, venueId);
      res.json(activeVotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getIncidentsByUser(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { requireSelfOrStaff } = await import("../utils/ownership");
      if (!requireSelfOrStaff(req, res, userId)) return;

      const incidents = await storage.getIncidentsByUser(userId);
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRecentIncidents(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { venueId } = req.params;
      const { hours = "24" } = req.query;
      const incidents = await storage.getRecentIncidents(venueId, parseInt(hours as string));
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
