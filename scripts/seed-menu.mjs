import "dotenv/config";
import Item from "../lib/models/Item.js";
import Menu from "../lib/models/Menu.js";
import Restaurant from "../lib/models/Restaurant.js";
import connectDB from "../lib/db.js";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/400x400/86A6DE/ffffff?text=Menu+Item";

const ITEMS = [
  // Starters
  { name: "Paneer Tikka",       description: "Smoky grilled cottage cheese marinated in yogurt and tandoori spices", price: 240, category: "Starters", calories: 350, isVeg: true,  spiceLevel: "medium" },
  { name: "Chicken 65",         description: "Crispy fried chicken tossed with curry leaves and red chillies",       price: 290, category: "Starters", calories: 480, isVeg: false, spiceLevel: "hot" },
  { name: "Hara Bhara Kebab",   description: "Spinach and green pea patties, lightly spiced and pan-seared",         price: 200, category: "Starters", calories: 280, isVeg: true,  isVegan: true, spiceLevel: "mild" },
  { name: "Crispy Corn",        description: "Battered sweet corn tossed with chillies and bell peppers",            price: 180, category: "Starters", calories: 320, isVeg: true,  spiceLevel: "medium" },
  { name: "Tandoori Wings",     description: "Chicken wings marinated in tandoori spices, fire-roasted",             price: 320, category: "Starters", calories: 460, isVeg: false, spiceLevel: "medium" },

  // Main Course — Veg
  { name: "Dal Makhani",         description: "Creamy black lentils slow-cooked with butter and cream",              price: 220, category: "Main Course", calories: 380, isVeg: true, spiceLevel: "mild" },
  { name: "Paneer Butter Masala",description: "Cottage cheese cubes in rich tomato cream gravy",                     price: 260, category: "Main Course", calories: 420, isVeg: true, spiceLevel: "mild" },
  { name: "Veg Biryani",         description: "Aromatic basmati rice layered with mixed vegetables and whole spices",price: 280, category: "Main Course", calories: 480, isVeg: true, spiceLevel: "medium" },
  { name: "Chana Masala",        description: "Chickpeas simmered in spicy onion-tomato gravy",                      price: 190, category: "Main Course", calories: 340, isVeg: true, isVegan: true, isGlutenFree: true, spiceLevel: "medium" },
  { name: "Palak Paneer",        description: "Cottage cheese cubes in creamy spinach gravy",                        price: 240, category: "Main Course", calories: 360, isVeg: true, spiceLevel: "mild" },

  // Main Course — Non-veg
  { name: "Butter Chicken",      description: "Tender tandoori chicken in silky tomato butter gravy",                price: 340, category: "Main Course", calories: 520, isVeg: false, spiceLevel: "mild" },
  { name: "Chicken Biryani",     description: "Hyderabadi-style biryani with marinated chicken and saffron",          price: 360, category: "Main Course", calories: 650, isVeg: false, spiceLevel: "medium" },
  { name: "Mutton Rogan Josh",   description: "Kashmiri slow-cooked mutton curry with aromatic spices",              price: 420, category: "Main Course", calories: 580, isVeg: false, spiceLevel: "hot" },
  { name: "Fish Tikka Masala",   description: "Marinated fish chunks in rich spiced gravy",                          price: 380, category: "Main Course", calories: 460, isVeg: false, spiceLevel: "medium" },
  { name: "Grilled Chicken",     description: "Lean grilled chicken breast with herbs, lemon and pepper",            price: 320, category: "Main Course", calories: 280, isVeg: false, isGlutenFree: true, spiceLevel: "mild" },

  // Breads
  { name: "Garlic Naan",         description: "Soft leavened flatbread topped with garlic and butter",               price: 70,  category: "Breads", calories: 220, isVeg: true, spiceLevel: "mild" },
  { name: "Tandoori Roti",       description: "Whole-wheat flatbread baked in a clay tandoor",                       price: 40,  category: "Breads", calories: 140, isVeg: true, isVegan: true, spiceLevel: "mild" },
  { name: "Lachha Paratha",      description: "Multi-layered crispy whole-wheat flatbread",                          price: 60,  category: "Breads", calories: 260, isVeg: true, spiceLevel: "mild" },

  // Beverages
  { name: "Mango Lassi",         description: "Thick chilled yogurt drink with sweet ripe mango",                    price: 90,  category: "Beverages", calories: 180, isVeg: true, isGlutenFree: true, spiceLevel: "mild" },
  { name: "Masala Chai",         description: "Spiced milk tea brewed with cardamom, ginger and clove",              price: 40,  category: "Beverages", calories: 70,  isVeg: true, isGlutenFree: true, spiceLevel: "mild" },
  { name: "Fresh Lime Soda",     description: "Sparkling lime water — choose sweet, salty, or mixed",                price: 60,  category: "Beverages", calories: 90,  isVeg: true, isVegan: true, isGlutenFree: true, spiceLevel: "mild" },
  { name: "Cold Coffee",         description: "Iced coffee blended with milk and a scoop of vanilla ice cream",      price: 130, category: "Beverages", calories: 250, isVeg: true, spiceLevel: "mild" },
  { name: "Buttermilk",          description: "Spiced churned yogurt drink with cumin and coriander",                price: 50,  category: "Beverages", calories: 80,  isVeg: true, isGlutenFree: true, spiceLevel: "mild" },

  // Desserts
  { name: "Gulab Jamun",         description: "Soft milk-solid dumplings soaked in cardamom-rose syrup",             price: 110, category: "Desserts", calories: 280, isVeg: true, spiceLevel: "mild" },
  { name: "Kulfi",               description: "Traditional dense Indian frozen dessert with pistachios",             price: 100, category: "Desserts", calories: 220, isVeg: true, isGlutenFree: true, spiceLevel: "mild" },
  { name: "Brownie with Ice Cream", description: "Warm dark chocolate brownie topped with vanilla ice cream",        price: 160, category: "Desserts", calories: 380, isVeg: true, spiceLevel: "mild" },
];

const SECTION_ORDER = ["Starters", "Main Course", "Breads", "Beverages", "Desserts"];

async function main() {
  const slug = process.argv[2];
  await connectDB();

  if (!slug) {
    const restaurants = await Restaurant.find({}).select("slug name status").lean();
    console.log("\nUsage: node scripts/seed-menu.mjs <restaurant-slug>\n");
    console.log("Available restaurants:");
    if (restaurants.length === 0) {
      console.log("  (none — sign up a restaurant first via /auth/signup)");
    } else {
      restaurants.forEach((r) => console.log(`  - ${r.slug}  (${r.name}, ${r.status})`));
    }
    process.exit(1);
  }

  const restaurant = await Restaurant.findOne({ slug });
  if (!restaurant) {
    console.error(`No restaurant found with slug "${slug}"`);
    process.exit(1);
  }

  console.log(`Seeding menu for "${restaurant.name}" (slug: ${slug})…`);

  await Item.deleteMany({ restaurantId: restaurant._id });
  await Menu.deleteMany({ restaurantId: restaurant._id });

  const itemsWithDefaults = ITEMS.map((it) => ({
    ...it,
    image: PLACEHOLDER_IMAGE,
    available: true,
    restaurantId: restaurant._id,
    isVegan: it.isVegan || false,
    isGlutenFree: it.isGlutenFree || false,
    spiceLevel: it.spiceLevel || "medium",
  }));

  const created = await Item.insertMany(itemsWithDefaults);
  console.log(`✓ Created ${created.length} items`);

  const byCategory = new Map();
  for (const item of created) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item._id);
  }

  const sections = SECTION_ORDER
    .filter((name) => byCategory.has(name))
    .map((name) => ({ name, items: byCategory.get(name) }));

  await Menu.create({
    restaurantId: restaurant._id,
    title: `${restaurant.name} Menu`,
    sections,
  });
  console.log(`✓ Created menu with ${sections.length} sections`);

  console.log("\n✅ Seed complete.");
  console.log("\nNext steps:");
  console.log("  1. Make sure the Atlas Vector Search index `items_vector` shows Active in Compass");
  console.log("  2. Log in as super-admin in your browser, open dev console, and run:");
  console.log("     fetch('/api/admin/embed-items', { method: 'POST' }).then(r=>r.json()).then(console.log)");
  console.log("  3. Visit your customer page and ask the AI waiter:");
  console.log('     "What vegetarian dishes do you have?"  →  expect veg-only suggestions');
  console.log('     "I want something spicy"                →  expect Chicken 65 / Mutton Rogan Josh\n');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
