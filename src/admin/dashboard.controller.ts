import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const dashboardController = Router();

dashboardController.get("/stats", async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      ordersToday,
      totalRevenue,
      revenueToday,
      totalUsers,
      activeOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.user.count(),
      prisma.order.count({
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"],
          },
        },
      }),
    ]);

    res.json({
      totalOrders,
      ordersToday,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      revenueToday: revenueToday._sum.totalAmount ?? 0,
      totalUsers,
      activeOrders,
    });
  } catch (err) {
    next(err);
  }
});

dashboardController.get("/popular-items", async (_req, res, next) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
    });

    const result = items.map((item) => ({
      menuItem: menuItems.find((m) => m.id === item.menuItemId),
      totalOrdered: item._sum.quantity,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});
