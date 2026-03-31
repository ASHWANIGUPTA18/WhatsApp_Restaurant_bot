import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  console.log("Cleared existing menu data...");

  const menuData = [
    {
      category: "Burgers",
      sortOrder: 1,
      items: [
        { name: "Burgers", price: 8.99 },
      ],
    },
    {
      category: "Fries",
      sortOrder: 2,
      items: [
        { name: "Fries", price: 3.00 },
        { name: "Chicken Loaded Fries", price: 5.00 },
        { name: "Truffle Fries", price: 5.00 },
        { name: "Cheesy Fries", price: 4.00 },
        { name: "Beef Brisket Fries", price: 8.00 },
        { name: "Mac & Cheese Fries", price: 5.00 },
        { name: "Pepperoni Pizza Fries", price: 5.00 },
        { name: "Salt & Pepper Fries", price: 5.00 },
        { name: "Sweet Potato Fries", price: 4.50 },
        { name: "Peri Fries", price: 4.00 },
        { name: "Ranch Fries", price: 4.50 },
      ],
    },
    {
      category: "Churros",
      sortOrder: 3,
      items: [
        { name: "Lotus Biscoff Churros", price: 6.00 },
        { name: "Nutella Churros", price: 6.00 },
        { name: "Oreo Churros", price: 6.00 },
      ],
    },
    {
      category: "Drinks",
      sortOrder: 4,
      items: [
        { name: "Ice Cola", price: 1.50 },
        { name: "Ice Pro Max", price: 1.50 },
        { name: "Ice Lemon", price: 1.50 },
        { name: "Ice Orange", price: 1.50 },
        { name: "Ice Tropical", price: 1.50 },
        { name: "Ice Mango", price: 1.50 },
        { name: "Ice Strawberry", price: 1.50 },
        { name: "Water", price: 1.00 },
        { name: "Ice Cola Bottle", price: 3.49 },
        { name: "Ice Pro Max Bottle", price: 3.49 },
      ],
    },
    {
      category: "Wings Only",
      sortOrder: 5,
      items: [
        { name: "Wings ONLY", price: 7.50 },
      ],
    },
    {
      category: "Rice Box",
      sortOrder: 6,
      items: [
        { name: "Original (No Sauce) Rice Box", price: 8.99 },
        { name: "Mango Habanero Rice Box", price: 8.99 },
        { name: "Hotshot Rice Box", price: 8.99 },
        { name: "Chilli Lime Rice Box", price: 8.99 },
        { name: "Korean BBQ Rice Box", price: 8.99 },
        { name: "Sticky BBQ Rice Box", price: 8.99 },
        { name: "Sweet Chilli Rice Box", price: 8.99 },
        { name: "Garlic Parmesan Rice Box", price: 8.99 },
        { name: "Lemon Pepper Rice Box", price: 8.99 },
        { name: "Katsu Curry Rice Box", price: 8.99 },
        { name: "Sweet & Sour Rice Box", price: 8.99 },
        { name: "Honey Garlic Rice Box", price: 8.99 },
        { name: "Pineapple Teriyaki Rice Box", price: 8.99 },
        { name: "Honey BBQ Rice Box", price: 8.99 },
        { name: "Salt & Pepper Rice Box", price: 8.99 },
        { name: "Miami Heat Rice Box", price: 8.99 },
        { name: "Butter Chicken Rice Box", price: 8.99 },
        { name: "Louisiana Rub Rice Box", price: 8.99 },
      ],
    },
    {
      category: "Big Sharer",
      sortOrder: 7,
      items: [
        {
          name: "Big Share",
          price: 30.00,
          description: "25 pcs wings, choice of any five flavours, any 2 fries, Tango bottle or Pepsi bottle",
        },
      ],
    },
    {
      category: "Milkshakes",
      sortOrder: 8,
      items: [
        { name: "Biscoff Milkshake", price: 5.00 },
        { name: "Aero Milkshake", price: 5.00 },
        { name: "Skittles Milkshake", price: 5.00 },
        { name: "Oreo Milkshake", price: 5.00 },
        { name: "Ferrero Rocher Milkshake", price: 5.00 },
        { name: "Daim Milkshake", price: 5.00 },
        { name: "Kinder Bueno Milkshake", price: 5.00 },
        { name: "Maltesers Milkshake", price: 5.00 },
        { name: "Milkybar Milkshake", price: 5.00 },
        { name: "Nutella Milkshake", price: 5.00 },
        { name: "Kinder Bueno White", price: 5.00 },
      ],
    },
    {
      category: "Dips",
      sortOrder: 9,
      items: [
        { name: "Ranch Dip", price: 1.00 },
        { name: "Honey Mustard Dip", price: 1.00 },
      ],
    },
    {
      category: "Noodle Box",
      sortOrder: 10,
      items: [
        { name: "Sticky BBQ Noodles", price: 8.99 },
        { name: "Korean BBQ Noodles", price: 8.99 },
        { name: "Sweet Chilli Noodles", price: 8.99 },
        { name: "Hotshot Noodles", price: 8.99 },
        { name: "Garlic Parmesan Noodles", price: 8.99 },
        { name: "Lemon Pepper Noodles", price: 8.99 },
        { name: "Mango Habanero Noodles", price: 8.99 },
        { name: "Honey Garlic Noodles", price: 8.99 },
        { name: "Chilli & Lime Noodles", price: 8.99 },
        { name: "Salt & Pepper Noodles", price: 8.99 },
        { name: "Honey BBQ Noodles", price: 8.99 },
        { name: "Katsu Noodles", price: 8.99 },
        { name: "Pineapple Teriyaki Noodles", price: 8.99 },
        { name: "Miami Heat Noodles", price: 8.99 },
        { name: "Louisiana Rub Noodles", price: 8.99 },
        { name: "Sweet & Sour Noodles", price: 8.99 },
        { name: "Sticky Caramel Noodles", price: 8.99 },
        { name: "Butter Chicken Noodles", price: 8.99 },
      ],
    },
    {
      category: "Sides",
      sortOrder: 11,
      items: [
        { name: "Mac & Cheese Bites", price: 5.00 },
        { name: "Dynamite Prawns", price: 6.50 },
        { name: "Jalapeno Nuggets", price: 5.00 },
        { name: "Crispy Calamari", price: 6.00 },
        { name: "Caramel Chicken Poppers", price: 5.00 },
        { name: "Salt & Pepper Prawns", price: 7.00 },
        { name: "Dynamite Chicken Bites", price: 6.50 },
        { name: "Chicken Loaded Nachos", price: 6.50 },
        { name: "Baked Mac & Cheese", price: 5.50 },
        { name: "Brisket Mac & Cheese", price: 8.50 },
        { name: "Spicy Korean Bites", price: 5.50 },
      ],
    },
  ];

  for (const categoryData of menuData) {
    const category = await prisma.menuCategory.create({
      data: {
        name: categoryData.category,
        sortOrder: categoryData.sortOrder,
        isActive: true,
      },
    });

    await prisma.menuItem.createMany({
      data: categoryData.items.map((item, index) => ({
        categoryId: category.id,
        name: item.name,
        price: item.price,
        description: (item as any).description ?? null,
        isAvailable: true,
        sortOrder: index + 1,
      })),
    });

    console.log(`✓ ${category.name} — ${categoryData.items.length} items`);
  }

  const totalItems = menuData.reduce((sum, c) => sum + c.items.length, 0);
  console.log(`\nSeed complete: ${menuData.length} categories, ${totalItems} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
