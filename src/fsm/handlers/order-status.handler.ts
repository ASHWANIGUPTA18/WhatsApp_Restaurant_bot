import type { ParsedMessageEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import { buildButtonMessage } from "../../whatsapp/message-builder.js";
import { getActiveOrdersForUser } from "../../services/order.service.js";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "⏳ Pending",
  CONFIRMED: "✅ Confirmed",
  PREPARING: "👨‍🍳 Preparing",
  OUT_FOR_DELIVERY: "🚗 Out for Delivery",
  DELIVERED: "📦 Delivered",
  CANCELLED: "❌ Cancelled",
};

export async function handleOrderStatus(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const orders = await getActiveOrdersForUser(session.userId);

  if (orders.length === 0) {
    const msg = buildButtonMessage(
      session.phoneNumber,
      "You don't have any active orders. Would you like to place one?",
      [{ id: "browse_menu", title: "Browse Menu" }]
    );
    await outgoingQueue.add("order-no-active", { message: msg });
    return { ...session, state: ConversationState.MAIN_MENU, data: { ...session.data, currentListIds: [] } };
  }

  const orderTexts = orders.map((order) => {
    const items = order.items
      .map((i) => `  ${i.quantity}x ${i.menuItem.name}`)
      .join("\n");
    const status = STATUS_LABELS[order.status] ?? order.status;
    return (
      `Order #${order.id.slice(-6).toUpperCase()}\n` +
      `Status: ${status}\n` +
      `${items}\n` +
      `Total: ₹${order.totalAmount}`
    );
  });

  const msg = buildButtonMessage(
    session.phoneNumber,
    `📋 *Your Orders*\n\n${orderTexts.join("\n\n---\n\n")}`,
    [
      { id: "browse_menu", title: "New Order" },
      { id: "view_cart", title: "View Cart" },
    ]
  );
  await outgoingQueue.add("order-status", { message: msg });

  return { ...session, state: ConversationState.ORDER_ACTIVE };
}
