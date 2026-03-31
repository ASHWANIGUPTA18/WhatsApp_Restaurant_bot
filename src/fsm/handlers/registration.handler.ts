import type {
  ParsedMessageEvent,
  TextMessageEvent,
  LocationMessageEvent,
} from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import { buildTextMessage, buildButtonMessage } from "../../whatsapp/message-builder.js";
import { updateUserName, updateUserLocation } from "../../services/user.service.js";
import { reverseGeocode } from "../../services/geocoding.service.js";

export async function handleRegistrationName(
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const textEvent = event as TextMessageEvent;
  const name = textEvent.text.trim();

  await updateUserName(session.userId, name);

  const msg = buildTextMessage(
    session.phoneNumber,
    `Nice to meet you, *${name}*! 👋\n\nPlease share your *delivery location* so we know where to bring your food.\n\nTap 📎 → *Location* → Send your current location.`
  );
  await outgoingQueue.add("reg-ask-location", { message: msg });

  return {
    ...session,
    state: ConversationState.AWAITING_LOCATION,
  };
}

export async function handleRegistrationNameRetry(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const msg = buildTextMessage(
    session.phoneNumber,
    `Please type your name to continue.`
  );
  await outgoingQueue.add("reg-name-retry", { message: msg });
  return session;
}

export async function handleRegistrationLocation(
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const locEvent = event as LocationMessageEvent;

  const { formattedAddress } = await reverseGeocode(
    locEvent.latitude,
    locEvent.longitude
  );

  await updateUserLocation(
    session.userId,
    locEvent.latitude,
    locEvent.longitude,
    formattedAddress
  );

  // Confirm location saved, then immediately show the menu
  const confirmMsg = buildTextMessage(
    session.phoneNumber,
    `📍 *Delivery location saved!*\n${formattedAddress}\n\nHere's our menu — let's get ordering! 🍗`
  );
  await outgoingQueue.add("reg-location-saved", { message: confirmMsg });

  // Show main menu right after
  const menuMsg = buildButtonMessage(
    session.phoneNumber,
    `What would you like to do?`,
    [
      { id: "browse_menu", title: "🍽️ Browse Menu" },
      { id: "view_cart", title: "🛒 View Cart" },
      { id: "my_orders", title: "📦 My Orders" },
    ]
  );
  await outgoingQueue.add("reg-show-menu", { message: menuMsg });

  return {
    ...session,
    state: ConversationState.MAIN_MENU,
  };
}

export async function handleRegistrationLocationRetry(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const msg = buildTextMessage(
    session.phoneNumber,
    `I need your location for delivery. Please share it using:\n📎 (attachment) → Location → Send your current location.`
  );
  await outgoingQueue.add("reg-location-retry", { message: msg });
  return session;
}
