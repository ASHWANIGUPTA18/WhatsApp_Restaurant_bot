import { Router } from "express";
import { logger } from "../config/logger.js";
import { validateRazorpaySignature } from "./razorpay.validator.js";
import { paymentQueue } from "../queues/payment.queue.js";

export const razorpayRouter = Router();

razorpayRouter.post("/", validateRazorpaySignature, async (req, res) => {
  try {
    const event = req.body;
    logger.info({ event: event.event }, "Razorpay webhook received");

    await paymentQueue.add("payment-event", {
      event: event.event,
      payload: event.payload,
    });

    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Error processing Razorpay webhook");
    res.sendStatus(200);
  }
});
