import type { Express, Request, Response } from "express";
import { requireStaffOrOwner } from "../replitAuth";

interface BanAppeal {
  id: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const banAppeals: BanAppeal[] = [];

export function setupBanAppealRoutes(app: Express) {
  app.post("/api/ban-appeals", (req: Request, res: Response) => {
    const { email, reason } = req.body;

    if (!email || !reason) {
      return res.status(400).json({ message: "Email and reason are required." });
    }

    const existing = banAppeals.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.status === "pending"
    );
    if (existing) {
      return res.status(409).json({
        message: "You already have a pending appeal.",
        appeal: existing,
      });
    }

    const appeal: BanAppeal = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      reason,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    banAppeals.push(appeal);
    return res.status(201).json({ appeal });
  });

  app.get("/api/ban-appeals/status", (req: Request, res: Response) => {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const appeals = banAppeals
      .filter((a) => a.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (appeals.length === 0) {
      return res.json({ appeal: null });
    }

    return res.json({ appeal: appeals[0] });
  });

  app.get("/api/admin/ban-appeals", requireStaffOrOwner, (_req: Request, res: Response) => {
    const sorted = [...banAppeals].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    return res.json({ appeals: sorted });
  });

  app.put("/api/admin/ban-appeals/:id", requireStaffOrOwner, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const appeal = banAppeals.find((a) => a.id === id);
    if (!appeal) {
      return res.status(404).json({ message: "Appeal not found." });
    }

    if (status && ["approved", "denied"].includes(status)) {
      appeal.status = status;
    }
    if (adminResponse !== undefined) {
      appeal.adminResponse = adminResponse;
    }
    appeal.updatedAt = new Date();

    return res.json({ appeal });
  });
}
