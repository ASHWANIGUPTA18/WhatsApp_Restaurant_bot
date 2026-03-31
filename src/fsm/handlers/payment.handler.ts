import type { ParsedMessageEvent } from "../../whatsapp/types.js";
import type { UserSession } from "../states.js";
import { outgoingQueue } from "../../queues/whatsapp-outgoing.queue.js";
import { buildTextMessage } from "../../whatsapp/message-builder.js";
import { findPaymentByOrderId } from "../../services/payment.service.js";

export async function handlePaymentPending(
  session: UserSession,
  _event: ParsedMessageEvent
): Promise<UserSession> {
  const orderId = session.data.pendingOrderId;

  if (orderId) {
    const payment = await findPaymentByOrderId(orderId);

    if (payment?.status === "PAID") {
      const msg = buildTextMessage(
        session.phoneNumber,
        `Your payment has been received! Your order is being prepared. We'll update you on the status.`
      );
      await outgoingQueue.add("payment-already-paid", { message: msg });
      return session;
    }

    if (payment?.paymentUrl) {
      const msg = buildTextMessage(
        session.phoneNumber,
        `Your payment is still pending. Please complete it here:\n${payment.paymentUrl}\n\nIf you've already paid, please wait a moment for confirmation.`
      );
      await outgoingQueue.add("payment-reminder", { message: msg });
      return session;
    }
  }

  const msg = buildTextMessage(
    session.phoneNumber,
    "Please complete your pending payment. If you need help, type 'menu' to start over."
  );
  await outgoingQueue.add("payment-pending-generic", { message: msg });
  return session;
}
