import express from "express";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { webhookRateLimiter } from "./middleware/rate-limiter.js";
import { whatsappRouter } from "./webhooks/whatsapp.router.js";
import { razorpayRouter } from "./webhooks/razorpay.router.js";
import { adminRouter } from "./admin/admin.router.js";

export const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Webhook routes
app.use("/webhook/whatsapp", webhookRateLimiter, whatsappRouter);
app.use("/webhook/razorpay", webhookRateLimiter, razorpayRouter);

// Admin API
app.use("/api/admin", adminRouter);

// Error handler (must be last)
app.use(errorHandler);
