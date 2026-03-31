// ─── Incoming Webhook Types ───

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: string;
  metadata: WebhookMetadata;
  contacts?: WebhookContact[];
  messages?: RawMessage[];
  statuses?: MessageStatus[];
}

export interface WebhookMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

export interface MessageStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

// Raw incoming message from webhook
export interface RawMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

// ─── Parsed Message Events (normalized) ───

export type ParsedMessageEvent =
  | TextMessageEvent
  | ButtonReplyEvent
  | ListReplyEvent
  | LocationMessageEvent
  | UnsupportedMessageEvent;

interface BaseMessageEvent {
  from: string;
  messageId: string;
  timestamp: number;
}

export interface TextMessageEvent extends BaseMessageEvent {
  type: "text";
  text: string;
}

export interface ButtonReplyEvent extends BaseMessageEvent {
  type: "button_reply";
  buttonId: string;
  buttonTitle: string;
}

export interface ListReplyEvent extends BaseMessageEvent {
  type: "list_reply";
  listId: string;
  listTitle: string;
  listDescription?: string;
}

export interface LocationMessageEvent extends BaseMessageEvent {
  type: "location";
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface UnsupportedMessageEvent extends BaseMessageEvent {
  type: "unsupported";
  rawType: string;
}

// ─── Outgoing Message Types ───

export interface OutgoingTextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { body: string };
}

export interface OutgoingButtonMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    body: { text: string };
    action: {
      buttons: Array<{
        type: "reply";
        reply: { id: string; title: string };
      }>;
    };
  };
}

export interface OutgoingListMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "list";
    body: { text: string };
    action: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export type OutgoingMessage =
  | OutgoingTextMessage
  | OutgoingButtonMessage
  | OutgoingListMessage;
