import { prisma } from "../config/prisma.js";

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { menuItem: true } } },
  });

  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: { items: { include: { menuItem: true } } },
  });
}

export async function addItemToCart(
  userId: string,
  menuItemId: string,
  quantity: number = 1
) {
  const cart = await getOrCreateCart(userId);

  // Upsert: if item already in cart, increment quantity
  return prisma.cartItem.upsert({
    where: {
      cartId_menuItemId: { cartId: cart.id, menuItemId },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      cartId: cart.id,
      menuItemId,
      quantity,
    },
    include: { menuItem: true },
  });
}

export async function removeItemFromCart(userId: string, menuItemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return null;

  return prisma.cartItem.deleteMany({
    where: { cartId: cart.id, menuItemId },
  });
}

export async function getCartWithItems(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export function calculateCartTotal(
  items: Array<{ quantity: number; menuItem: { price: any } }>
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.menuItem.price.toString()),
    0
  );
}
