import type { Request, Response } from "express";

/**
 * Returns true if the requesting user owns the resource (their userId matches
 * `paramUserId`) OR they are STAFF/OWNER. Otherwise sends 403 and returns false.
 *
 * Assumes the route is guarded by `requireAnyAuth` so `req.dbUser` is populated.
 * Use this for routes that take a `:userId` URL param.
 */
export function requireSelfOrStaff(
  req: Request,
  res: Response,
  paramUserId: string,
): boolean {
  const dbUser = (req as any).dbUser;
  if (!dbUser) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  if (dbUser.id === paramUserId) return true;
  if (dbUser.globalRole === "OWNER" || dbUser.globalRole === "STAFF") return true;
  res.status(403).json({ message: "Forbidden" });
  return false;
}

/**
 * Like `requireSelfOrStaff` but compares against a `:playerId` URL/body param.
 * Looks up the requesting user's Player record and checks ownership.
 *
 * Returns true if the request is allowed, false (and sends 403) otherwise.
 */
export async function requireSelfPlayerOrStaff(
  req: Request,
  res: Response,
  paramPlayerId: string,
  storage: {
    getPlayerByUserId(userId: string): Promise<{ id: string } | undefined>;
  },
): Promise<boolean> {
  const dbUser = (req as any).dbUser;
  if (!dbUser) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  if (dbUser.globalRole === "OWNER" || dbUser.globalRole === "STAFF") {
    return true;
  }
  const player = await storage.getPlayerByUserId(dbUser.id);
  if (player && player.id === paramPlayerId) return true;
  res.status(403).json({ message: "Forbidden" });
  return false;
}
