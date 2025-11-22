import mongoose from "mongoose";
import "dotenv/config";

import Item from "../lib/models/Item.js";
import Menu from "../lib/models/Menu.js";
import Table from "../lib/models/Table.js";
import Order from "../lib/models/Order.js";
import connectDB from "../lib/db.js";

async function seed() {
  await connectDB();

  await Item.deleteMany({});
  await Menu.deleteMany({});
  await Table.deleteMany({});
  await Order.deleteMany({});

  // Create diverse items with categories and calories
  const items = await Item.insertMany([
    // Starters
    { name: "Paneer Tikka", description: "Grilled cottage cheese with spices", price: 220, category: "Starters", calories: 350, available: true },
    { name: "Chicken Wings", description: "Crispy fried chicken wings", price: 280, category: "Starters", calories: 450, available: true },
    { name: "French Fries", description: "Crispy golden fries", price: 120, category: "Starters", calories: 320, available: true },
    { name: "Spring Rolls", description: "Vegetable spring rolls", price: 150, category: "Starters", calories: 280, available: true },

    // Main Course
    { name: "Chicken Biryani", description: "Aromatic rice with tender chicken", price: 350, category: "Main Course", calories: 650, available: true },
    { name: "Veg Biryani", description: "Fragrant vegetable biryani", price: 280, category: "Main Course", calories: 480, available: true },
    { name: "Butter Chicken", description: "Creamy tomato curry with chicken", price: 320, category: "Main Course", calories: 520, available: true },
    { name: "Dal Makhani", description: "Creamy black lentils", price: 200, category: "Main Course", calories: 380, available: true },
    { name: "Paneer Butter Masala", description: "Cottage cheese in rich gravy", price: 240, category: "Main Course", calories: 420, available: true },
    { name: "Grilled Chicken", description: "Healthy grilled chicken breast", price: 300, category: "Main Course", calories: 280, available: true },

    // Beverages
    { name: "Mango Lassi", description: "Sweet mango yogurt drink", price: 80, category: "Beverages", calories: 180, available: true },
    { name: "Cold Coffee", description: "Chilled coffee with ice cream", price: 120, category: "Beverages", calories: 250, available: true },
    { name: "Fresh Lime Soda", description: "Refreshing lime soda", price: 60, category: "Beverages", calories: 90, available: true },
    { name: "Masala Chai", description: "Hot spiced tea", price: 40, category: "Beverages", calories: 70, available: true },

    // Desserts
    { name: "Gulab Jamun", description: "Sweet milk dumplings", price: 100, category: "Desserts", calories: 280, available: true },
    { name: "Ice Cream", description: "Vanilla ice cream", price: 90, category: "Desserts", calories: 200, available: true },
    { name: "Brownie", description: "Chocolate brownie with ice cream", price: 150, category: "Desserts", calories: 380, available: true },
  ]);

  // Create menu with sections
  await Menu.create({
    title: "Restaurant Menu",
    sections: [
      { name: "Starters", items: items.slice(0, 4).map(i => i._id) },
      { name: "Main Course", items: items.slice(4, 10).map(i => i._id) },
      { name: "Beverages", items: items.slice(10, 14).map(i => i._id) },
      { name: "Desserts", items: items.slice(14, 17).map(i => i._id) },
    ],
  });

  // Create multiple tables
  await Table.insertMany([
    { tableNumber: 1, slug: "table-1" },
    { tableNumber: 2, slug: "table-2" },
    { tableNumber: 3, slug: "table-3" },
    { tableNumber: 4, slug: "table-4" },
    { tableNumber: 5, slug: "table-5" },
    { tableNumber: 6, slug: "table-6" },
    { tableNumber: 7, slug: "table-7" },
    { tableNumber: 8, slug: "table-8" },
    { tableNumber: 9, slug: "table-9" },
    { tableNumber: 10, slug: "table-10" },
  ]);

  console.log("✅ Seed finished!");
  console.log(`📦 Created ${items.length} items`);
  console.log("📋 Created menu with 4 sections");
  console.log("🪑 Created 10 tables");
  process.exit(0);
}

seed();
