import { ConversationState } from "./states.js";
import type { ParsedMessageEvent } from "../whatsapp/types.js";

export interface Transition {
  nextState: ConversationState;
  handler: string;
}

export function transition(
  currentState: ConversationState,
  event: ParsedMessageEvent
): Transition {
  switch (currentState) {
    case ConversationState.IDLE:
      return { nextState: ConversationState.IDLE, handler: "welcome" };

    case ConversationState.AWAITING_NAME:
      if (event.type === "text") {
        return {
          nextState: ConversationState.AWAITING_LOCATION,
          handler: "registration_name",
        };
      }
      return {
        nextState: ConversationState.AWAITING_NAME,
        handler: "registration_name_retry",
      };

    case ConversationState.AWAITING_LOCATION:
      if (event.type === "location") {
        return {
          nextState: ConversationState.MAIN_MENU,
          handler: "registration_location",
        };
      }
      return {
        nextState: ConversationState.AWAITING_LOCATION,
        handler: "registration_location_retry",
      };

    case ConversationState.MAIN_MENU:
      return resolveMainMenuTransition(event);

    case ConversationState.BROWSING_CATEGORIES:
      if (event.type === "list_reply") {
        return {
          nextState: ConversationState.BROWSING_ITEMS,
          handler: "menu_show_items",
        };
      }
      if (event.type === "button_reply" && event.buttonId === "main_menu") {
        return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };
      }
      // Any other text → show main menu
      return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };

    case ConversationState.BROWSING_ITEMS:
      if (event.type === "list_reply") {
        return {
          nextState: ConversationState.BROWSING_ITEMS,
          handler: "cart_add_item",
        };
      }
      if (event.type === "button_reply") {
        return resolveItemsButtonTransition(event.buttonId);
      }
      return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };

    case ConversationState.VIEWING_CART:
      if (event.type === "button_reply") {
        return resolveCartButtonTransition(event.buttonId);
      }
      return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };

    case ConversationState.AWAITING_DELIVERY_LOCATION:
      if (event.type === "location") {
        return {
          nextState: ConversationState.AWAITING_PAYMENT,
          handler: "checkout_create_order",
        };
      }
      if (event.type === "button_reply" && event.buttonId === "use_saved_location") {
        return {
          nextState: ConversationState.AWAITING_PAYMENT,
          handler: "checkout_use_saved_location",
        };
      }
      return {
        nextState: ConversationState.AWAITING_DELIVERY_LOCATION,
        handler: "checkout_location_retry",
      };

    case ConversationState.AWAITING_PAYMENT:
      return {
        nextState: ConversationState.AWAITING_PAYMENT,
        handler: "payment_pending",
      };

    case ConversationState.ORDER_ACTIVE:
      return resolveMainMenuTransition(event);

    default:
      return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };
  }
}

function resolveMainMenuTransition(event: ParsedMessageEvent): Transition {
  if (event.type === "button_reply") {
    switch (event.buttonId) {
      case "browse_menu":
        return {
          nextState: ConversationState.BROWSING_CATEGORIES,
          handler: "menu_show_categories",
        };
      case "view_cart":
        return {
          nextState: ConversationState.VIEWING_CART,
          handler: "cart_view",
        };
      case "my_orders":
        return {
          nextState: ConversationState.ORDER_ACTIVE,
          handler: "order_status",
        };
    }
  }

  if (event.type === "text") {
    const lower = (event as any).text.toLowerCase().trim();
    if (lower === "menu" || lower === "order" || lower === "browse") {
      return {
        nextState: ConversationState.BROWSING_CATEGORIES,
        handler: "menu_show_categories",
      };
    }
    if (lower === "cart") {
      return { nextState: ConversationState.VIEWING_CART, handler: "cart_view" };
    }
    if (lower === "status" || lower === "orders") {
      return { nextState: ConversationState.ORDER_ACTIVE, handler: "order_status" };
    }
  }

  return { nextState: ConversationState.MAIN_MENU, handler: "show_main_menu" };
}

function resolveItemsButtonTransition(buttonId: string): Transition {
  switch (buttonId) {
    case "add_more_items":
      // Re-show the same category's items
      return {
        nextState: ConversationState.BROWSING_ITEMS,
        handler: "menu_show_current_items",
      };
    case "back_to_categories":
      return {
        nextState: ConversationState.BROWSING_CATEGORIES,
        handler: "menu_show_categories",
      };
    case "view_cart":
      return {
        nextState: ConversationState.VIEWING_CART,
        handler: "cart_view",
      };
    case "checkout":
      return {
        nextState: ConversationState.AWAITING_DELIVERY_LOCATION,
        handler: "checkout_start",
      };
    case "main_menu":
      return {
        nextState: ConversationState.MAIN_MENU,
        handler: "show_main_menu",
      };
    default:
      return {
        nextState: ConversationState.MAIN_MENU,
        handler: "show_main_menu",
      };
  }
}

function resolveCartButtonTransition(buttonId: string): Transition {
  switch (buttonId) {
    case "checkout":
      return {
        nextState: ConversationState.AWAITING_DELIVERY_LOCATION,
        handler: "checkout_start",
      };
    case "continue_shopping":
      return {
        nextState: ConversationState.BROWSING_CATEGORIES,
        handler: "menu_show_categories",
      };
    case "clear_cart":
      return {
        nextState: ConversationState.MAIN_MENU,
        handler: "cart_clear",
      };
    default:
      return {
        nextState: ConversationState.VIEWING_CART,
        handler: "cart_view",
      };
  }
}
