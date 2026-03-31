import type { ParsedMessageEvent, ListReplyEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import {
  buildTextMessage,
  buildButtonMessage,
} from "../../whatsapp/message-builder.js";
import {
  addItemToCart,
  getCartWithItems,
  clearCart,
  calculateCartTotal,
} from "../../services/cart.service.js";
import { getItemById, getCategoryById } from "../../services/menu.service.js";

export async function handleAddItem(
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const listEvent = event as ListReplyEvent;
  const menuItemId = listEvent.listId.replace("item_", "");

  const menuItem = await getItemById(menuItemId);
  if (!menuItem) {
    const msg = buildTextMessage(
      session.phoneNumber,
      "Sorry, that item is no longer available."
    );
    await outgoingQueue.add("cart-item-not-found", { message: msg });
    return session;
  }

  await addItemToCart(session.userId, menuItemId);

  // Get cart item count for confirmation
  const cart = await getCartWithItems(session.userId);
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 1;

  // Build context-aware "Add More" button label using current category
  let addMoreTitle = "Add More Items";
  const categoryId = session.data.selectedCategoryId;
  if (categoryId) {
    const category = await getCategoryById(categoryId);
    if (category) {
      addMoreTitle = `More ${category.name}`.slice(0, 20);
    }
  }

  const msg = buildButtonMessage(
    session.phoneNumber,
    `✅ *${menuItem.name}* added!\n\n🛒 Cart: ${itemCount} item${itemCount !== 1 ? "s" : ""} · £${calculateCartTotal(cart?.items ?? []).toFixed(2)}`,
    [
      { id: "add_more_items", title: addMoreTitle },
      { id: "view_cart", title: "🛒 View Cart" },
      { id: "main_menu", title: "🏠 Main Menu" },
    ]
  );
  await outgoingQueue.add("cart-item-added", { message: msg });

  return session; // stay in BROWSING_ITEMS so numbered replies still select items
}

export async function handleViewCart(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const cart = await getCartWithItems(session.userId);

  if (!cart || cart.items.length === 0) {
    const msg = buildButtonMessage(
      session.phoneNumber,
      "🛒 Your cart is empty!\n\nBrowse the menu to add items.",
      [{ id: "browse_menu", title: "🍽️ Browse Menu" }]
    );
    await outgoingQueue.add("cart-empty", { message: msg });
    return { ...session, state: ConversationState.MAIN_MENU, data: { ...session.data, currentListIds: [] } };
  }

  const total = calculateCartTotal(cart.items);
  const itemsList = cart.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.menuItem.name} ×${item.quantity} — £${(
          item.quantity * parseFloat(item.menuItem.price.toString())
        ).toFixed(2)}`
    )
    .join("\n");

  const cartText = `🛒 *Your Cart*\n\n${itemsList}\n\n*Total: £${total.toFixed(2)}*`;

  const msg = buildButtonMessage(session.phoneNumber, cartText, [
    { id: "checkout", title: "✅ Checkout" },
    { id: "continue_shopping", title: "➕ Add More" },
    { id: "clear_cart", title: "🗑️ Clear Cart" },
  ]);
  await outgoingQueue.add("cart-view", { message: msg });

  return { ...session, state: ConversationState.VIEWING_CART };
}

export async function handleClearCart(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  await clearCart(session.userId);

  const msg = buildButtonMessage(
    session.phoneNumber,
    "🗑️ Cart cleared!\n\nWhat would you like to do?",
    [
      { id: "browse_menu", title: "🍽️ Browse Menu" },
      { id: "my_orders", title: "📦 My Orders" },
    ]
  );
  await outgoingQueue.add("cart-cleared", { message: msg });

  return { ...session, state: ConversationState.MAIN_MENU, data: { ...session.data, currentListIds: [] } };
}
