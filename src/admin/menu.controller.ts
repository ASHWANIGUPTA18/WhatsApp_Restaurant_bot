import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const menuController = Router();

// ─── Categories ───

menuController.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

menuController.post("/categories", async (req, res, next) => {
  try {
    const { name, description, sortOrder } = req.body;
    const category = await prisma.menuCategory.create({
      data: { name, description, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

menuController.put("/categories/:id", async (req, res, next) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: { name, description, sortOrder, isActive },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

menuController.delete("/categories/:id", async (req, res, next) => {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// ─── Items ───

menuController.get("/items", async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const where = categoryId ? { categoryId: categoryId as string } : {};
    const items = await prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

menuController.post("/items", async (req, res, next) => {
  try {
    const { categoryId, name, description, price, imageUrl, sortOrder } =
      req.body;
    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price,
        imageUrl,
        sortOrder: sortOrder ?? 0,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

menuController.put("/items/:id", async (req, res, next) => {
  try {
    const { name, description, price, imageUrl, isAvailable, sortOrder } =
      req.body;
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { name, description, price, imageUrl, isAvailable, sortOrder },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

menuController.delete("/items/:id", async (req, res, next) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
