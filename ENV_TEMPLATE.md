# Environment Variables Template - Copy to .env

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/orderbyqr?retryWrites=true&w=majority

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Razorpay Public Key (exposed to frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Cloudinary Public Config (exposed to frontend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Super Admin Credentials (CHANGE THESE IN PRODUCTION!)
SUPER_ADMIN_EMAIL=papa@orderbyqr.com
SUPER_ADMIN_PASSWORD=papa123

# Public Super Admin Email (for client-side demo - REMOVE IN PRODUCTION!)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=papa@orderbyqr.com
NEXT_PUBLIC_SUPER_ADMIN_PASSWORD=papa123

# Instructions:
# 1. Copy this file content to a new file named .env
# 2. Replace all xxxxx values with your actual credentials
# 3. Generate NEXTAUTH_SECRET with: openssl rand -base64 32
# 4. CHANGE super admin password before deploying to production!
# 5. Never commit .env to version control
# 6. For production, use live Razorpay keys (rzp_live_xxx)
# 7. Remove NEXT_PUBLIC_SUPER_ADMIN_* variables in production
# 8. Sign up for Cloudinary at https://cloudinary.com to get your credentials
