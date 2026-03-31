import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../config/prisma.js";

export async function createPaymentRecord(
  orderId: string,
  amount: number,
  razorpayLinkId: string,
  paymentUrl: string
) {
  return prisma.payment.create({
    data: {
      orderId,
      amount: new Decimal(amount.toFixed(2)),
      razorpayLinkId,
      paymentUrl,
      status: "PENDING",
    },
  });
}

export async function findPaymentByLinkId(razorpayLinkId: string) {
  return prisma.payment.findUnique({
    where: { razorpayLinkId },
    include: { order: { include: { user: true } } },
  });
}

export async function findPaymentByOrderId(orderId: string) {
  return prisma.payment.findUnique({
    where: { orderId },
  });
}
