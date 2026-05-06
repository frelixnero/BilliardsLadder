import type { Express, Request, Response } from "express";
import {
  getRackPointsState,
  getLedger,
} from "../services/rackPointsService";
import { storage } from "../storage";

/**
 * Pull the canonical user id off the session for either auth path:
 *  - Replit OAuth stores it under `req.user.claims.sub`
 *  - Password login stores it under `req.user.id`
 */
function getSessionUserId(req: Request): string | null {
  if (!req.isAuthenticated || !req.isAuthenticated()) return null;
  const u: any = req.user;
  const raw = u?.claims?.sub ?? u?.id;
  return raw == null ? null : String(raw);
}

export function setupMeRoutes(app: Express) {
  /**
   * GET /api/me/rack-points
   * Returns the current user's points balance + streak state.
   */
  app.get("/api/me/rack-points", async (req: Request, res: Response) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const state = await getRackPointsState(userId);
      if (!state) {
        return res
          .status(200)
          .json({ rackPoints: 0, streakDays: 0, streakLastDay: null });
      }
      return res.json(state);
    } catch (err: any) {
      console.error("[GET /api/me/rack-points] failed:", err?.message);
      return res.status(500).json({ message: "Failed to load rack points" });
    }
  });

  /**
   * GET /api/me/rack-points/ledger?limit=20
   * Returns the user's most recent ledger entries (newest first).
   */
  app.get(
    "/api/me/rack-points/ledger",
    async (req: Request, res: Response) => {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const rawLimit = Number.parseInt(String(req.query.limit ?? "20"), 10);
      const limit =
        Number.isFinite(rawLimit) && rawLimit > 0
          ? Math.min(rawLimit, 100)
          : 20;
      try {
        const entries = await getLedger(userId, limit);
        return res.json(entries);
      } catch (err: any) {
        console.error(
          "[GET /api/me/rack-points/ledger] failed:",
          err?.message
        );
        return res.status(500).json({ message: "Failed to load ledger" });
      }
    }
  );

  /**
   * GET /api/me/notifications?limit=20&unreadOnly=true
   * Returns the user's in-app notification feed (newest first) plus the
   * unread count so the bell badge can be rendered in one round-trip.
   */
  app.get("/api/me/notifications", async (req: Request, res: Response) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const rawLimit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const unreadOnly = String(req.query.unreadOnly ?? "") === "true";
    try {
      const [items, unreadCount] = await Promise.all([
        storage.getNotificationsByUser(userId, { limit, unreadOnly }),
        storage.countUnreadNotifications(userId),
      ]);
      return res.json({ items, unreadCount });
    } catch (err: any) {
      console.error("[GET /api/me/notifications] failed:", err?.message);
      return res.status(500).json({ message: "Failed to load notifications" });
    }
  });

  /**
   * POST /api/me/notifications/:id/read — mark a single notification read.
   * Verifies the notification belongs to the session user before mutating.
   */
  app.post(
    "/api/me/notifications/:id/read",
    async (req: Request, res: Response) => {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      try {
        const existing = await storage.getNotification(req.params.id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Notification not found" });
        }
        const updated = await storage.markNotificationRead(req.params.id);
        return res.json(updated);
      } catch (err: any) {
        console.error("[POST /api/me/notifications/:id/read] failed:", err?.message);
        return res.status(500).json({ message: "Failed to update notification" });
      }
    }
  );

  /**
   * POST /api/me/notifications/read-all — mark every notification for the
   * user as read. Returns the number of rows updated.
   */
  app.post(
    "/api/me/notifications/read-all",
    async (req: Request, res: Response) => {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      try {
        const count = await storage.markAllNotificationsRead(userId);
        return res.json({ updated: count });
      } catch (err: any) {
        console.error("[POST /api/me/notifications/read-all] failed:", err?.message);
        return res.status(500).json({ message: "Failed to update notifications" });
      }
    }
  );

  /**
   * DELETE /api/me/notifications/:id — dismiss a notification.
   * Verifies ownership before deleting.
   */
  app.delete(
    "/api/me/notifications/:id",
    async (req: Request, res: Response) => {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      try {
        const existing = await storage.getNotification(req.params.id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Notification not found" });
        }
        await storage.deleteNotification(req.params.id);
        return res.json({ success: true });
      } catch (err: any) {
        console.error("[DELETE /api/me/notifications/:id] failed:", err?.message);
        return res.status(500).json({ message: "Failed to delete notification" });
      }
    }
  );
}
