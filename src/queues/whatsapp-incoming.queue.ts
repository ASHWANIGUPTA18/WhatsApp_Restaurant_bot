import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const incomingQueue = new Queue("whatsapp-incoming", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
