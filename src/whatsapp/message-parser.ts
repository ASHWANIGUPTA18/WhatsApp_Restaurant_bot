import type { RawMessage, ParsedMessageEvent } from "./types.js";

export function parseMessage(raw: RawMessage): ParsedMessageEvent {
  const base = {
    from: raw.from,
    messageId: raw.id,
    timestamp: parseInt(raw.timestamp, 10) * 1000,
  };

  switch (raw.type) {
    case "text":
      return {
        ...base,
        type: "text",
        text: raw.text!.body,
      };

    case "interactive":
      if (raw.interactive?.type === "button_reply" && raw.interactive.button_reply) {
        return {
          ...base,
          type: "button_reply",
          buttonId: raw.interactive.button_reply.id,
          buttonTitle: raw.interactive.button_reply.title,
        };
      }

      if (raw.interactive?.type === "list_reply" && raw.interactive.list_reply) {
        return {
          ...base,
          type: "list_reply",
          listId: raw.interactive.list_reply.id,
          listTitle: raw.interactive.list_reply.title,
          listDescription: raw.interactive.list_reply.description,
        };
      }

      return { ...base, type: "unsupported", rawType: "interactive_unknown" };

    case "location":
      return {
        ...base,
        type: "location",
        latitude: raw.location!.latitude,
        longitude: raw.location!.longitude,
        name: raw.location!.name,
        address: raw.location!.address,
      };

    default:
      return { ...base, type: "unsupported", rawType: raw.type };
  }
}
