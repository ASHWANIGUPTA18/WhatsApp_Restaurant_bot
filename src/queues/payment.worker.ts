import type { Job, Processor } from "bullmq";
import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import { outgoingQueue } from "./whatsapp-outgoing.queue.js";
import { buildTextMessage } from "../whatsapp/message-builder.js";

interface PaymentJobData {
  event: string;
  payload: {
    payment_link?: {
      entity: {
        id: string;
        amount: number;
        status: string;
      };
    };
    payment?: {
      entity: {
        id: string;
        amount: number;
        status: string;
        notes?: Record<string, string>;
      };
    };
  };
}

export const processPaymentEvent: Processor<PaymentJobData> = async (
  job: Job<PaymentJobData>
) => {
  const { event, payload } = job.data;
  logger.info({ event, jobId: job.id }, "Processing payment event");

  if (event === "payment_link.paid") {
    const linkEntity = payload.payment_link?.entity;
    if (!linkEntity) return;

    // Find payment by Razorpay link ID
    const payment = await prisma.payment.findUnique({
      where: { razorpayLinkId: linkEntity.id },
      include: {
        order: {
          include: {
            user: true,
            items: { include: { menuItem: true } },
          },
        },
      },
    });

    if (!payment) {
      logger.warn({ linkId: linkEntity.id }, "Payment not found for link");
      return;
    }

    if (payment.status === "PAID") {
      logger.info({ paymentId: payment.id }, "Payment already processed");
      return;
    }

    // Update payment and order status
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          razorpayPaymentId: payload.payment?.entity?.id ?? null,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    // Send confirmation to user
    const order = payment.order;
    const itemsList = order.items
      .map((i) => `  ${i.quantity}x ${i.menuItem.name}`)
      .join("\n");

    const confirmMsg = buildTextMessage(
      order.user.phoneNumber,
      `Payment received! Your order #${order.id.slice(-6).toUpperCase()} is confirmed.\n\n` +
        `Items:\n${itemsList}\n\n` +
        `Total: ₹${order.totalAmount}\n\n` +
        `We'll notify you when your order is being prepared!`
    );

    await outgoingQueue.add("order-confirmation", { message: confirmMsg });

    logger.info(
      { orderId: order.id, paymentId: payment.id },
      "Payment confirmed, order updated"
    );
  }
};
