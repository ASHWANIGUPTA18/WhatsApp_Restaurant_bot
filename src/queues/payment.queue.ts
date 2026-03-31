import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const paymentQueue = new Queue("payment-events", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});
