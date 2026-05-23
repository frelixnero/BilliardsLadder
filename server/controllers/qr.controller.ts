import { Request, Response } from "express";

export function getQRCode() {
  return async (req: Request, res: Response) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ message: "URL parameter required" });
      }
      
      res.json({ 
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url as string)}` 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function generateQRRegistration() {
  return async (req: Request, res: Response) => {
    try {
      const sessionId = `qr-${Date.now()}`;
      const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
      const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
      const protocol = forwardedProto || req.protocol;
      const host = forwardedHost || req.get("host");
      const registrationUrl = `${protocol}://${host}/register/${sessionId}`;
      
      const session = {
        id: sessionId,
        qrCode: "",
        registrationUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        registrations: [],
        active: true,
      };

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function registerViaQR() {
  return async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { name, city, rating, theme, phone, membershipTier } = req.body;
      
      const player = {
        id: `player-${Date.now()}`,
        name,
        city,
        rating: rating || 500,
        theme,
        phone,
        membershipTier: membershipTier || "none",
        registeredVia: "qr",
        createdAt: new Date(),
      };

      res.json(player);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getQRStats() {
  return async (req: Request, res: Response) => {
    try {
      const stats = {
        totalQRRegistrations: 67,
        todayRegistrations: 5,
        activeSession: true,
        recentRegistrations: [],
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getRecentQRRegistrations() {
  return async (req: Request, res: Response) => {
    try {
      const recentRegistrations = [
        {
          id: "player-001",
          name: "Mike 'Chalk Dust' Johnson",
          city: "San Marcos",
          rating: 520,
          theme: "Precision over power",
          createdAt: new Date(),
        }
      ];
      res.json(recentRegistrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
