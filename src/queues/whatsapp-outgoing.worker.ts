import type { Job, Processor } from "bullmq";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";
import { logger } from "../config/logger.js";
import type { OutgoingMessage } from "../whatsapp/types.js";

interface OutgoingJobData {
  message: OutgoingMessage;
}

export const processOutgoingMessage: Processor<OutgoingJobData> = async (
  job: Job<OutgoingJobData>
) => {
  const { message } = job.data;
  logger.debug({ to: message.to, jobId: job.id }, "Sending outgoing message");
  await sendWhatsAppMessage(message);
};
