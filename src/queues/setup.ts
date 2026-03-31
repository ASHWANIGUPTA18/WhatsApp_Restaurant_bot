import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { processIncomingMessage } from "./whatsapp-incoming.worker.js";
import { processOutgoingMessage } from "./whatsapp-outgoing.worker.js";
import { processPaymentEvent } from "./payment.worker.js";

export function startWorkers(): Worker[] {
  const incomingWorker = new Worker(
    "whatsapp-incoming",
    processIncomingMessage,
    {
      connection: redis,
      concurrency: 5,
    }
  );

  const outgoingWorker = new Worker(
    "whatsapp-outgoing",
    processOutgoingMessage,
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 50, duration: 1000 }, // Rate limit: 50 msgs/sec
    }
  );

  const paymentWorker = new Worker("payment-events", processPaymentEvent, {
    connection: redis,
    concurrency: 3,
  });

  const workers = [incomingWorker, outgoingWorker, paymentWorker];

  for (const worker of workers) {
    worker.on("failed", (job, err) => {
      logger.error(
        { jobId: job?.id, queue: worker.name, err },
        "Job failed"
      );
    });

    worker.on("completed", (job) => {
      logger.debug({ jobId: job.id, queue: worker.name }, "Job completed");
    });
  }

  logger.info("All workers started");
  return workers;
}
