import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { WA_MESSAGES_URL } from "../utils/constants.js";
import type { OutgoingMessage } from "../whatsapp/types.js";

// ─── Twilio sender ───

async function sendViaTwilio(to: string, body: string): Promise<void> {
  const accountSid = env.TWILIO_ACCOUNT_SID!;
  const authToken = env.TWILIO_AUTH_TOKEN!;
  const from = env.TWILIO_WHATSAPP_FROM!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append("To", `whatsapp:+${to}`);
  params.append("From", from);
  params.append("Body", body);

  const response = await axios.post(url, params, {
    auth: { username: accountSid, password: authToken },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  logger.debug(
    { to, sid: response.data?.sid },
    "Twilio WhatsApp message sent"
  );
}

// ─── Meta Cloud API sender ───

const metaClient = axios.create({
  baseURL: WA_MESSAGES_URL,
  headers: {
    Authorization: `Bearer ${env.WA_ACCESS_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

async function sendViaMeta(message: OutgoingMessage): Promise<void> {
  const response = await metaClient.post("", message);
  logger.debug(
    { to: message.to, messageId: response.data?.messages?.[0]?.id },
    "Meta WhatsApp message sent"
  );
}

// ─── Public API ───

/**
 * Extracts plain text from any outgoing message type.
 * Used for Twilio which only supports text in sandbox mode.
 */
function extractText(message: OutgoingMessage): string {
  if (message.type === "text") {
    return message.text.body;
  }

  if (message.type === "interactive") {
    const interactive = (message as any).interactive;

    if (interactive.type === "button") {
      const body = interactive.body.text;
      const buttons: string = interactive.action.buttons
        .map((b: any, i: number) => `${i + 1}. ${b.reply.title}`)
        .join("\n");
      return `${body}\n\n${buttons}\n\n_(Reply with a number)_`;
    }

    if (interactive.type === "list") {
      const body = interactive.body.text;
      let index = 1;
      const rows = interactive.action.sections
        .flatMap((s: any) => s.rows)
        .map((r: any) => `${index++}. ${r.title}${r.description ? ` — ${r.description}` : ""}`)
        .join("\n");
      return `${body}\n\n${rows}\n\n_(Reply with a number)_`;
    }
  }

  return "Please reply with a number to continue.";
}

export async function sendWhatsAppMessage(
  message: OutgoingMessage
): Promise<void> {
  try {
    if (env.WA_PROVIDER === "twilio") {
      const text = extractText(message);
      await sendViaTwilio(message.to, text);
    } else {
      await sendViaMeta(message);
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error(
        {
          status: err.response?.status,
          data: err.response?.data,
          to: message.to,
        },
        "WhatsApp API error"
      );
    }
    throw err;
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  // Only supported on Meta Cloud API
  if (env.WA_PROVIDER !== "meta") return;

  try {
    await metaClient.post("", {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch (err) {
    logger.warn({ messageId, err }, "Failed to mark message as read");
  }
}
