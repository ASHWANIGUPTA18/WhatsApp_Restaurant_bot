import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { outgoingQueue } from "../queues/whatsapp-outgoing.queue.js";
import { buildTextMessage } from "../whatsapp/message-builder.js";
import type { OrderStatus } from "@prisma/client";

export const orderController = Router();

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Being Prepared",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

orderController.get("/", async (req, res, next) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = status ? { status: status as OrderStatus } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { phoneNumber: true, name: true } },
          items: { include: { menuItem: { select: { name: true } } } },
          payment: { select: { status: true, paidAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page as string) });
  } catch (err) {
    next(err);
  }
});

orderController.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        items: { include: { menuItem: true } },
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

orderController.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body as { status: OrderStatus };

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: true },
    });

    // Notify customer via WhatsApp
    const statusLabel = STATUS_LABELS[status] ?? status;
    const msg = buildTextMessage(
      order.user.phoneNumber,
      `Order #${order.id.slice(-6).toUpperCase()} update:\n\nYour order is now *${statusLabel}*.` +
        (status === "OUT_FOR_DELIVERY"
          ? "\n\nYour food is on its way!"
          : "") +
        (status === "DELIVERED"
          ? "\n\nEnjoy your meal! Thank you for ordering with us."
          : "")
    );
    await outgoingQueue.add("order-status-update", { message: msg });

    res.json(order);
  } catch (err) {
    next(err);
  }
});
