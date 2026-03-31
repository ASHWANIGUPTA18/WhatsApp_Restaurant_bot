import type { ParsedMessageEvent } from "../whatsapp/types.js";
import type { UserSession } from "./states.js";
import { handleWelcome } from "./handlers/welcome.handler.js";
import {
  handleRegistrationName,
  handleRegistrationNameRetry,
  handleRegistrationLocation,
  handleRegistrationLocationRetry,
} from "./handlers/registration.handler.js";
import {
  handleShowCategories,
  handleShowItems,
  handleShowCurrentCategoryItems,
} from "./handlers/menu.handler.js";
import {
  handleAddItem,
  handleViewCart,
  handleClearCart,
} from "./handlers/cart.handler.js";
import {
  handleCheckoutStart,
  handleCheckoutUseSavedLocation,
  handleCheckoutCreateOrder,
  handleCheckoutLocationRetry,
} from "./handlers/checkout.handler.js";
import { handlePaymentPending } from "./handlers/payment.handler.js";
import { handleOrderStatus } from "./handlers/order-status.handler.js";
import { handleShowMainMenu } from "./handlers/main-menu.handler.js";

type Handler = (
  session: UserSession,
  event: ParsedMessageEvent
) => Promise<UserSession>;

const handlers: Record<string, Handler> = {
  welcome: handleWelcome as Handler,
  registration_name: handleRegistrationName,
  registration_name_retry: handleRegistrationNameRetry,
  registration_location: handleRegistrationLocation,
  registration_location_retry: handleRegistrationLocationRetry,
  show_main_menu: handleShowMainMenu,
  menu_show_categories: handleShowCategories,
  menu_show_items: handleShowItems,
  menu_show_current_items: handleShowCurrentCategoryItems,
  cart_add_item: handleAddItem,
  cart_view: handleViewCart,
  cart_clear: handleClearCart,
  checkout_start: handleCheckoutStart,
  checkout_use_saved_location: handleCheckoutUseSavedLocation,
  checkout_create_order: handleCheckoutCreateOrder,
  checkout_location_retry: handleCheckoutLocationRetry,
  payment_pending: handlePaymentPending,
  order_status: handleOrderStatus,
};

export async function dispatch(
  handlerName: string,
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const handler = handlers[handlerName];
  if (!handler) {
    throw new Error(`Unknown handler: ${handlerName}`);
  }
  return handler(session, event);
}
