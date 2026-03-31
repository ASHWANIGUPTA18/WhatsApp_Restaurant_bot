import type { Job, Processor } from "bullmq";
import { logger } from "../config/logger.js";
import { parseMessage } from "../whatsapp/message-parser.js";
import { markMessageAsRead } from "../services/whatsapp.service.js";
import { getSession, setSession } from "../fsm/session.js";
import { ConversationState } from "../fsm/states.js";
import type { UserSession } from "../fsm/states.js";
import { transition } from "../fsm/machine.js";
import { dispatch } from "../fsm/dispatcher.js";
import { resolveTextNavigation } from "../whatsapp/text-navigator.js";
import type { RawMessage, WebhookMetadata, WebhookContact } from "../whatsapp/types.js";

interface IncomingJobData {
  provider: "meta" | "twilio";
  message: RawMessage;
  metadata: WebhookMetadata;
  contacts?: WebhookContact[];
}

export const processIncomingMessage: Processor<IncomingJobData> = async (
  job: Job<IncomingJobData>
) => {
  const { message } = job.data;

  // Parse the raw message
  let event = parseMessage(message);
  logger.info(
    { from: event.from, type: event.type, jobId: job.id },
    "Processing incoming message"
  );

  // Mark as read (Meta only, no-op for Twilio)
  markMessageAsRead(event.messageId).catch(() => {});

  // Skip truly unsupported messages
  if (event.type === "unsupported") {
    logger.debug({ rawType: (event as any).rawType }, "Skipping unsupported message type");
    return;
  }

  // Load session from Redis
  let session = await getSession(event.from);
  const currentState = session?.state ?? ConversationState.IDLE;

  // Resolve numbered text replies → button/list events (Twilio sandbox compat)
  if (event.type === "text") {
    event = resolveTextNavigation(
      event,
      currentState,
      session?.data?.currentListIds
    );
    logger.debug(
      { originalType: "text", resolvedType: event.type, from: event.from },
      "Text navigation resolved"
    );
  }

  // Run FSM transition
  const { nextState, handler } = transition(currentState, event);

  logger.debug(
    { currentState, nextState, handler, from: event.from },
    "FSM transition"
  );

  // Create default session if none exists
  if (!session) {
    session = {
      state: currentState,
      userId: "",
      phoneNumber: event.from,
      data: {},
      updatedAt: Date.now(),
    };
  }

  // Dispatch to handler
  const updatedSession = await dispatch(handler, session, event);

  // Persist updated session
  await setSession(updatedSession);

  logger.info(
    { from: event.from, state: updatedSession.state, handler },
    "Message processed"
  );
};
