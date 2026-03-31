import type { ParsedMessageEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import { buildButtonMessage } from "../../whatsapp/message-builder.js";

export async function handleShowMainMenu(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const msg = buildButtonMessage(
    session.phoneNumber,
    "🏠 *Main Menu*\n\nWhat would you like to do?",
    [
      { id: "browse_menu", title: "🍽️ Browse Menu" },
      { id: "view_cart", title: "🛒 View Cart" },
      { id: "my_orders", title: "📦 My Orders" },
    ]
  );
  await outgoingQueue.add("main-menu", { message: msg });

  return { ...session, state: ConversationState.MAIN_MENU, data: { ...session.data, currentListIds: [] } };
}
