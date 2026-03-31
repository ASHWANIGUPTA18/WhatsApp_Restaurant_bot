/**
 * Converts numbered text replies ("1", "2", "3") into button/list reply events.
 * This allows Twilio sandbox (text-only) to mimic interactive message navigation.
 */
import type { ParsedMessageEvent, TextMessageEvent } from "./types.js";
import { ConversationState } from "../fsm/states.js";

interface ButtonMapping {
  [buttonIndex: string]: { id: string; title: string };
}

// Maps each state to the buttons/options shown to the user
const STATE_BUTTON_MAPS: Partial<Record<ConversationState, ButtonMapping>> = {
  [ConversationState.MAIN_MENU]: {
    "1": { id: "browse_menu", title: "Browse Menu" },
    "2": { id: "view_cart", title: "View Cart" },
    "3": { id: "my_orders", title: "My Orders" },
  },
  [ConversationState.BROWSING_ITEMS]: {
    // Numbers are reserved for item selection — only keyword shortcuts here
    "back": { id: "back_to_categories", title: "Back to Categories" },
    "b":    { id: "back_to_categories", title: "Back to Categories" },
    "cart": { id: "view_cart", title: "View Cart" },
    "c":    { id: "view_cart", title: "View Cart" },
    "more": { id: "add_more_items", title: "Add More Items" },
    "m":    { id: "add_more_items", title: "Add More Items" },
    "checkout": { id: "checkout", title: "Checkout" },
  },
  [ConversationState.VIEWING_CART]: {
    "1": { id: "checkout", title: "Checkout" },
    "2": { id: "continue_shopping", title: "Continue Shopping" },
    "3": { id: "clear_cart", title: "Clear Cart" },
  },
  [ConversationState.AWAITING_DELIVERY_LOCATION]: {
    "1": { id: "use_saved_location", title: "Yes, deliver here" },
  },
  [ConversationState.ORDER_ACTIVE]: {
    "1": { id: "browse_menu", title: "Browse Menu" },
    "2": { id: "view_cart", title: "View Cart" },
  },
};

/**
 * Tries to resolve a numbered text reply into a button_reply event.
 * Returns the original event unchanged if no mapping found.
 */
export function resolveTextNavigation(
  event: ParsedMessageEvent,
  currentState: ConversationState,
  listItemIds?: string[] // ordered list of row IDs currently shown
): ParsedMessageEvent {
  if (event.type !== "text") return event;

  const text = (event as TextMessageEvent).text.trim().toLowerCase();
  const base = {
    from: event.from,
    messageId: event.messageId,
    timestamp: event.timestamp,
  };

  // Check button maps for current state FIRST.
  // This ensures "1"/"2"/"3" in MAIN_MENU/VIEWING_CART always maps to
  // the correct nav buttons, not to stale listItemIds from a prior browsing state.
  const buttonMap = STATE_BUTTON_MAPS[currentState];
  if (buttonMap && buttonMap[text]) {
    const btn = buttonMap[text];
    return {
      ...base,
      type: "button_reply",
      buttonId: btn.id,
      buttonTitle: btn.title,
    };
  }

  // Only resolve numbered replies to list items when the user is actively
  // browsing categories or items. In all other states (MAIN_MENU, VIEWING_CART,
  // etc.) listItemIds may be stale from a previous browsing session and must
  // NOT intercept navigation numbers.
  const isBrowsingState =
    currentState === ConversationState.BROWSING_ITEMS ||
    currentState === ConversationState.BROWSING_CATEGORIES;

  if (isBrowsingState && listItemIds && listItemIds.length > 0) {
    const index = parseInt(text, 10);
    if (!isNaN(index) && index >= 1 && index <= listItemIds.length) {
      const selectedId = listItemIds[index - 1]!;
      return {
        ...base,
        type: "list_reply",
        listId: selectedId,
        listTitle: `Item ${index}`,
      };
    }
  }

  // Keyword shortcuts (work in any state)
  if (text === "menu" || text === "start" || text === "hi" || text === "hello") {
    return {
      ...base,
      type: "button_reply",
      buttonId: "browse_menu",
      buttonTitle: "Browse Menu",
    };
  }

  if (text === "cart") {
    return {
      ...base,
      type: "button_reply",
      buttonId: "view_cart",
      buttonTitle: "View Cart",
    };
  }

  if (text === "orders" || text === "status") {
    return {
      ...base,
      type: "button_reply",
      buttonId: "my_orders",
      buttonTitle: "My Orders",
    };
  }

  return event;
}
