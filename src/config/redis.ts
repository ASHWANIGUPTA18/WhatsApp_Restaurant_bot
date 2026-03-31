import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) => logger.error({ err }, "Redis error"));

  return client;
}

export const redis = createRedisClient();
