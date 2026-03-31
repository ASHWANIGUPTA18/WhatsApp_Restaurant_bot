import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      })
    : null;

interface CreatePaymentLinkParams {
  amount: number;
  orderId: string;
  customerPhone: string;
  customerName: string;
  description?: string;
}

interface PaymentLinkResult {
  linkId: string;
  shortUrl: string;
}

export function isPaymentEnabled(): boolean {
  return razorpay !== null;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  // Demo mode: return a fake link
  if (!razorpay) {
    const fakeId = `demo_${params.orderId.slice(-8)}`;
    logger.info(
      { orderId: params.orderId },
      "Demo mode: skipping real payment link"
    );
    return {
      linkId: fakeId,
      shortUrl: `[DEMO - no payment required]`,
    };
  }

  try {
    const link = await razorpay.paymentLink.create({
      amount: Math.round(params.amount * 100),
      currency: "INR",
      description:
        params.description ?? `Order #${params.orderId.slice(-6).toUpperCase()}`,
      customer: {
        contact: `+${params.customerPhone}`,
        name: params.customerName,
      },
      notify: { sms: false, email: false },
      callback_url: undefined,
      callback_method: undefined,
      notes: {
        order_id: params.orderId,
      },
    } as any);

    logger.info(
      { linkId: link.id, orderId: params.orderId },
      "Payment link created"
    );

    return {
      linkId: link.id,
      shortUrl: link.short_url,
    };
  } catch (err) {
    logger.error({ err, orderId: params.orderId }, "Failed to create payment link");
    throw err;
  }
}
