import type { ParsedMessageEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import { buildTextMessage, buildButtonMessage } from "../../whatsapp/message-builder.js";
import { findUserByPhone, createUser } from "../../services/user.service.js";

export async function handleWelcome(
  session: UserSession | null,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const phone = event.from;

  let user = await findUserByPhone(phone);
  if (!user) {
    user = await createUser(phone);
  }

  // Step 1 — No name yet
  if (!user.name) {
    const msg = buildTextMessage(
      phone,
      `👋 Welcome to *Wing Stop*!\n\nBefore we show you the menu, we need a couple of details.\n\nWhat's your *name*?`
    );
    await outgoingQueue.add("welcome-ask-name", { message: msg });

    return {
      state: ConversationState.AWAITING_NAME,
      userId: user.id,
      phoneNumber: phone,
      data: {},
      updatedAt: Date.now(),
    };
  }

  // Step 2 — Has name but no location
  if (!user.latitude) {
    const msg = buildTextMessage(
      phone,
      `Welcome back, *${user.name}*! 👋\n\nWe still need your *delivery location*.\n\nTap 📎 → *Location* → Send your current location.`
    );
    await outgoingQueue.add("welcome-ask-location", { message: msg });

    return {
      state: ConversationState.AWAITING_LOCATION,
      userId: user.id,
      phoneNumber: phone,
      data: {},
      updatedAt: Date.now(),
    };
  }

  // Step 3 — Fully registered, show menu
  const msg = buildButtonMessage(
    phone,
    `Welcome back, *${user.name}*! 👋\n\n📍 Delivering to: ${user.address ?? "your saved location"}\n\nWhat would you like?`,
    [
      { id: "browse_menu", title: "🍽️ Browse Menu" },
      { id: "view_cart", title: "🛒 View Cart" },
      { id: "my_orders", title: "📦 My Orders" },
    ]
  );
  await outgoingQueue.add("welcome-menu", { message: msg });

  return {
    state: ConversationState.MAIN_MENU,
    userId: user.id,
    phoneNumber: phone,
    data: {},
    updatedAt: Date.now(),
  };
}
