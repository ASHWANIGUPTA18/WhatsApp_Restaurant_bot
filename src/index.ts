import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { redis } from "./config/redis.js";
import { prisma } from "./config/prisma.js";
import { incomingQueue } from "./queues/whatsapp-incoming.queue.js";
import { outgoingQueue } from "./queues/whatsapp-outgoing.queue.js";
import { paymentQueue } from "./queues/payment.queue.js";
import { startWorkers } from "./queues/setup.js";

async function main() {
  // Start BullMQ workers
  const workers = startWorkers();

  // Start Express server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    server.close();

    // Close workers (let in-progress jobs finish)
    await Promise.all(workers.map((w) => w.close()));

    // Close queues
    await Promise.all([
      incomingQueue.close(),
      outgoingQueue.close(),
      paymentQueue.close(),
    ]);

    // Close connections
    await redis.quit();
    await prisma.$disconnect();

    logger.info("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
