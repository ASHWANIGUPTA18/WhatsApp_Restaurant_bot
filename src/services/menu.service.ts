import { prisma } from "../config/prisma.js";

export async function getActiveCategories() {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getItemsByCategory(categoryId: string) {
  return prisma.menuItem.findMany({
    where: { categoryId, isAvailable: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getItemById(itemId: string) {
  return prisma.menuItem.findUnique({ where: { id: itemId } });
}

export async function getCategoryById(categoryId: string) {
  return prisma.menuCategory.findUnique({ where: { id: categoryId } });
}
