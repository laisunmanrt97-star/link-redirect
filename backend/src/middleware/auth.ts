import { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const expected = process.env.API_TOKEN || "supersecret";

  if (token !== expected) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}
