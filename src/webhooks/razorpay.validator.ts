import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function validateRazorpaySignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validation if Razorpay is not configured (demo mode)
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    next();
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  if (!signature) {
    logger.warn("Missing X-Razorpay-Signature header");
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    logger.warn("Invalid Razorpay webhook signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  next();
}
