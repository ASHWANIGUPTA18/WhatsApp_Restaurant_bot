import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
