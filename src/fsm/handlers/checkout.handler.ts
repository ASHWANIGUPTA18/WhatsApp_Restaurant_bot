import type {
  ParsedMessageEvent,
  LocationMessageEvent,
} from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { ConversationState } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import {
  buildTextMessage,
  buildButtonMessage,
} from "../../whatsapp/message-builder.js";
import { findUserByPhone } from "../../services/user.service.js";
import { getCartWithItems, calculateCartTotal } from "../../services/cart.service.js";
import { createOrderFromCart } from "../../services/order.service.js";
import { createPaymentLink, isPaymentEnabled } from "../../services/razorpay.service.js";
import { createPaymentRecord } from "../../services/payment.service.js";
import { prisma } from "../../config/prisma.js";
import { reverseGeocode } from "../../services/geocoding.service.js";

export async function handleCheckoutStart(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const user = await findUserByPhone(session.phoneNumber);

  if (user?.latitude && user?.address) {
    const msg = buildButtonMessage(
      session.phoneNumber,
      `Deliver to your saved location?\n📍 ${user.address}`,
      [
        { id: "use_saved_location", title: "Yes, deliver here" },
        { id: "new_location", title: "New location" },
      ]
    );
    await outgoingQueue.add("checkout-ask-location", { message: msg });
  } else {
    const msg = buildTextMessage(
      session.phoneNumber,
      "Please share your delivery location.\n\nTap 📎 → Location → Send your current location."
    );
    await outgoingQueue.add("checkout-ask-location-new", { message: msg });
  }

  return {
    ...session,
    state: ConversationState.AWAITING_DELIVERY_LOCATION,
  };
}

export async function handleCheckoutUseSavedLocation(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const user = await findUserByPhone(session.phoneNumber);
  if (!user?.latitude) {
    const msg = buildTextMessage(
      session.phoneNumber,
      "No saved location found. Please share your delivery location."
    );
    await outgoingQueue.add("checkout-no-saved", { message: msg });
    return { ...session, state: ConversationState.AWAITING_DELIVERY_LOCATION };
  }

  return processCheckout(
    session,
    user.address,
    user.latitude,
    user.longitude!,
    user.name ?? "Customer"
  );
}

export async function handleCheckoutCreateOrder(
  session: UserSession,
  event: ParsedMessageEvent
): Promise<UserSession> {
  const locEvent = event as LocationMessageEvent;

  const { formattedAddress } = await reverseGeocode(
    locEvent.latitude,
    locEvent.longitude
  );

  const user = await findUserByPhone(session.phoneNumber);

  return processCheckout(
    session,
    formattedAddress,
    locEvent.latitude,
    locEvent.longitude,
    user?.name ?? "Customer"
  );
}

export async function handleCheckoutLocationRetry(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const msg = buildTextMessage(
    session.phoneNumber,
    "Please share your delivery location using:\n📎 → Location → Send your current location."
  );
  await outgoingQueue.add("checkout-location-retry", { message: msg });
  return session;
}

async function processCheckout(
  session: UserSession,
  address: string | null,
  lat: number,
  lng: number,
  customerName: string
): Promise<UserSession> {
  // Verify cart isn't empty
  const cart = await getCartWithItems(session.userId);
  if (!cart || cart.items.length === 0) {
    const msg = buildTextMessage(
      session.phoneNumber,
      "Your cart is empty! Please add items before checking out."
    );
    await outgoingQueue.add("checkout-empty-cart", { message: msg });
    return { ...session, state: ConversationState.MAIN_MENU };
  }

  const total = calculateCartTotal(cart.items);

  // Create order (atomically clears cart)
  const order = await createOrderFromCart(session.userId, address, lat, lng);

  const itemsList = order.items
    .map((i) => `  ${i.quantity}x ${i.menuItem.name} — ₹${i.unitPrice}`)
    .join("\n");

  if (!isPaymentEnabled()) {
    // Demo mode: auto-confirm order, no payment needed
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });

    const msg = buildButtonMessage(
      session.phoneNumber,
      `✅ *Order Confirmed!* (Demo Mode)\n\n` +
        `Order #${order.id.slice(-6).toUpperCase()}\n\n` +
        `${itemsList}\n\n` +
        `*Total: ₹${total.toFixed(2)}*\n` +
        `📍 ${address}\n\n` +
        `Your order is being prepared!`,
      [
        { id: "browse_menu", title: "New Order" },
        { id: "my_orders", title: "My Orders" },
      ]
    );
    await outgoingQueue.add("checkout-demo-confirmed", { message: msg });

    return {
      ...session,
      state: ConversationState.ORDER_ACTIVE,
      data: { ...session.data, pendingOrderId: order.id },
    };
  }

  // Production mode: create Razorpay payment link
  const { linkId, shortUrl } = await createPaymentLink({
    amount: total,
    orderId: order.id,
    customerPhone: session.phoneNumber,
    customerName,
  });

  await createPaymentRecord(order.id, total, linkId, shortUrl);

  const msg = buildTextMessage(
    session.phoneNumber,
    `📋 *Order Summary*\n\n` +
      `${itemsList}\n\n` +
      `*Total: ₹${total.toFixed(2)}*\n` +
      `📍 ${address}\n\n` +
      `Please complete your payment here:\n${shortUrl}\n\n` +
      `The link is valid for 15 minutes.`
  );
  await outgoingQueue.add("checkout-payment-link", { message: msg });

  return {
    ...session,
    state: ConversationState.AWAITING_PAYMENT,
    data: { ...session.data, pendingOrderId: order.id },
  };
}
