import type {
  OutgoingTextMessage,
  OutgoingButtonMessage,
  OutgoingListMessage,
} from "./types.js";

export function buildTextMessage(
  to: string,
  body: string
): OutgoingTextMessage {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };
}

export function buildButtonMessage(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>
): OutgoingButtonMessage {
  if (buttons.length > 3) {
    throw new Error("WhatsApp buttons max is 3");
  }

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply" as const,
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  };
}

export function buildListMessage(
  to: string,
  body: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>
): OutgoingListMessage {
  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonText,
        sections,
      },
    },
  };
}
