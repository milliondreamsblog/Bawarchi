# Bawarchie - Restaurant Ordering System

A modern, full-stack QR-based food ordering system built with Next.js, MongoDB, Razorpay, and OpenAI.

## 🚀 Features

- **QR Code Ordering**: Customers scan table QR codes to view menu and place orders
- **Secure Payments**: Integrated Razorpay payment gateway
- **AI Recommendations**: Smart meal suggestions based on calories, budget, and dietary preferences
- **Real-Time Orders**: Live order tracking with SWR polling
- **Admin Dashboard**: Complete management interface for items, menu, tables, and orders
- **Responsive Design**: Mobile-first UI with modern gradients and animations
- **Persistent Cart**: Cart state stored in localStorage with Zustand

## 📋 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Payments**: Razorpay Orders API
- **AI**: OpenAI GPT-4o-mini
- **State**: Zustand with persistence
- **Data Fetching**: SWR for real-time updates
- **QR Codes**: qrcode library

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (test/live credentials)
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Bawarchie
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/Bawarchie?retryWrites=true&w=majority

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Razorpay Public Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Seed Database

Populate your database with sample data:

```bash
npm run seed
```

This will create:
- 17 food items (starters, main course, beverages, desserts)
- Complete menu with 4 sections
- 10 tables with unique slugs

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage Guide

### For Customers

1. **Scan QR Code**: Use your phone camera to scan the QR code at your table
2. **Browse Menu**: View menu organized by sections (Starters, Main Course, etc.)
3. **Add to Cart**: Select items and quantities
4. **Checkout**: Click "Pay" button
5. **Payment**: Complete payment via Razorpay
6. **Confirmation**: Receive order confirmation

**Demo URL**: Navigate to `/t/table-1` for Table 1 menu

### For Restaurant Staff (Admin)

Access the admin dashboard at `/admin` with these sections:

#### Items Management (`/admin/items`)
- View all menu items
- Add new items with name, price, description, category, calories
- Toggle availability

#### Menu Builder (`/admin/menu`)
- Create menu sections
- Assign items to sections
- Update menu title
- Save menu structure

#### Tables Management (`/admin/tables`)
- Create new tables with unique slugs
- Generate QR codes automatically
- Download QR codes as PNG
- View table URLs

#### Orders Dashboard (`/admin/orders`)
- View all orders in real-time (auto-refreshes every 5 seconds)
- Filter by status (Pending, Preparing, Served)
- Update order status
- View order details and totals

### AI Assistant (`/chat`)

Ask the AI for meal recommendations:
- "Give me a 400 calorie meal"
- "Best combo under ₹200"
- "I want vegetarian food"

The AI analyzes your menu and provides smart recommendations.

## 🏗️ Project Structure

```
Bawarchie/
├── app/
│   ├── api/                    # API Routes
│   │   ├── items/             # Items CRUD
│   │   ├── menu/              # Menu management
│   │   ├── tables/            # Tables management
│   │   ├── orders/            # Orders management
│   │   ├── payments/          # Razorpay integration
│   │   │   ├── create-order/
│   │   │   └── verify/
│   │   └── ai/                # OpenAI recommendations
│   │       └── recommend/
│   ├── admin/                 # Admin Dashboard
│   │   ├── items/
│   │   ├── menu/
│   │   ├── tables/
│   │   ├── orders/
│   │   └── layout.tsx
│   ├── t/[slug]/              # Table Menu Pages
│   ├── chat/                  # AI Chat Interface
│   ├── order-success/         # Order Confirmation
│   ├── layout.tsx             # Root Layout
│   ├── page.tsx               # Home Page
│   └── globals.css            # Design System
├── components/                # Reusable Components
│   ├── Button.tsx
│   ├── ItemCard.tsx
│   ├── Cart.tsx
│   └── RazorpayCheckout.tsx
├── lib/
│   ├── db.js                  # MongoDB Connection
│   ├── models/                # Mongoose Models
│   │   ├── Item.js
│   │   ├── Menu.js
│   │   ├── Table.js
│   │   └── Order.js
│   └── store/
│       └── useCartStore.ts    # Zustand Cart Store
├── scripts/
│   └── seed.mjs               # Database Seeding
└── package.json
```

## 🔑 API Endpoints

### Items
- `GET /api/items` - List all items
- `POST /api/items` - Create new item

### Menu
- `GET /api/menu` - Get menu with populated items
- `POST /api/menu` - Update/create menu

### Tables
- `GET /api/tables` - List all tables
- `GET /api/tables?slug=table-1` - Get specific table
- `POST /api/tables` - Create new table

### Orders
- `GET /api/orders` - List all orders (sorted by newest)
- `POST /api/orders` - Create new order

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature

### AI
- `POST /api/ai/recommend` - Get meal recommendations
