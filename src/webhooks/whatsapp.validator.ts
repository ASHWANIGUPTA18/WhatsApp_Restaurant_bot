import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function validateWhatsAppSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip in dev mode or when Meta is not configured
  if (env.NODE_ENV === "development" || !env.WA_APP_SECRET) {
    next();
    return;
  }

  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  if (!signature) {
    logger.warn("Missing X-Hub-Signature-256 header");
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", env.WA_APP_SECRET!)
      .update(JSON.stringify(req.body))
      .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    logger.warn("Invalid WhatsApp webhook signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  next();
}
