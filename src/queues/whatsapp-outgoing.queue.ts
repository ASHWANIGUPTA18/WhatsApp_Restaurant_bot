import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const outgoingQueue = new Queue("whatsapp-outgoing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
