import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { verifyPassword } from "@/lib/utils/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check for super admin first
        const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@orderbyqr.com";
        const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "admin123";

        if (
          credentials.email === SUPER_ADMIN_EMAIL &&
          credentials.password === SUPER_ADMIN_PASSWORD
        ) {
          return {
            id: "super-admin",
            email: SUPER_ADMIN_EMAIL,
            name: "Super Admin",
            role: "super-admin",
          };
        }

        // Otherwise check for restaurant
        await connectDB();

        const restaurant = await Restaurant.findOne({
          email: credentials.email,
        }).lean();

        if (!restaurant) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          restaurant.password
        );

        if (!isValid) {
          return null;
        }

        // Check if restaurant is approved
        if (restaurant.status !== "approved") {
          throw new Error(`Account status: ${restaurant.status}`);
        }

        return {
          id: restaurant._id.toString(),
          email: restaurant.email,
          name: restaurant.name,
          role: "restaurant",
          slug: restaurant.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.slug = (user as any).slug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).slug = token.slug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
