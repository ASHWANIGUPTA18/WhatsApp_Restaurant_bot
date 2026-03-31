import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../config/prisma.js";
import type { OrderStatus } from "@prisma/client";

export async function createOrderFromCart(
  userId: string,
  deliveryAddress: string | null,
  deliveryLat: number | null,
  deliveryLng: number | null
) {
  return prisma.$transaction(async (tx) => {
    // Get cart with items
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { menuItem: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate total
    const totalAmount = cart.items.reduce(
      (sum, item) =>
        sum + item.quantity * parseFloat(item.menuItem.price.toString()),
      0
    );

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount: new Decimal(totalAmount.toFixed(2)),
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        items: {
          create: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.menuItem.price,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menuItem: true } },
      payment: true,
      user: true,
    },
  });
}

export async function getActiveOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] },
    },
    include: { items: { include: { menuItem: true } }, payment: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { user: true },
  });
}
