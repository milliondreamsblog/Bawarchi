# 🚀 Quick Start Guide

Get your OrderByQR system running in 5 minutes!

## 1. Install Dependencies ✅ (Already Done)

```bash
npm install
```

## 2. Set Up Environment Variables

1. Copy `.env.example` to `.env` (if available) or create a new `.env` file
2. Add your credentials:

```env
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/orderbyqr
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
OPENAI_API_KEY=sk-your_openai_api_key
```

### Getting Your API Keys:

**MongoDB Atlas**: 
- Sign up at https://www.mongodb.com/atlas
- Create a free cluster
- Get connection string from "Connect" → "Drivers"

**Razorpay**:
- Sign up at https://razorpay.com
- Go to Dashboard → Settings → API Keys
- Generate Test Mode keys

**OpenAI**:
- Sign up at https://platform.openai.com
- Go to API Keys section
- Create new secret key

## 3. Seed the Database

```bash
npm run seed
```

This creates:
- ✅ 17 menu items (starters, main course, beverages, desserts)
- 📋 Complete menu with 4 sections
- 🪑 10 tables with QR codes

## 4. Start Development Server

```bash
npm run dev
```

## 5. Open Your Browser

- **Home**: http://localhost:3000
- **Demo Menu**: http://localhost:3000/t/table-1
- **Admin Dashboard**: http://localhost:3000/admin/items
- **AI Chat**: http://localhost:3000/chat

## 📱 Test the Flow

### Customer Flow:
1. Go to `/t/table-1`
2. Browse menu items
3. Add items to cart
4. Click "Pay ₹XXX"
5. Use test card: `4111 1111 1111 1111`
6. Complete payment

### Admin Flow:
1. Go to `/admin/items` - View/add items
2. Go to `/admin/menu` - Build menu sections
3. Go to `/admin/tables` - Manage tables & QR codes
4. Go to `/admin/orders` - View incoming orders

## 🎉 You're Ready!

Your complete QR-based food ordering system is now running!

## 💡 Tips

- Use Razorpay **test mode** for development
- QR codes are at `/admin/tables`
- Orders auto-refresh every 5 seconds
- Cart persists in localStorage
- AI works with any query about calories, price, or preferences

## 🐛 Troubleshooting

**Can't connect to MongoDB?**
- Check your IP is whitelisted on Atlas
- Verify connection string is correct

**Razorpay not loading?**
- Clear browser cache
- Check NEXT_PUBLIC_RAZORPAY_KEY_ID is set
- Verify keys are for test mode

**AI not responding?**
- Check OpenAI API key is valid
- Verify you have API credits
- Check API quota limits

## 📚 Next Steps

- Read [README.md](file:///d:/codesPlayground/orderbyqr/README.md) for full documentation
- Check [walkthrough.md](file:///C:/Users/adit7/.gemini/antigravity/brain/5ba29caf-15f1-41c5-9dc7-e77e23054409/walkthrough.md) for detailed testing guide
- Deploy to Vercel when ready (see README)

---

Made with ❤️ - Happy Ordering!
