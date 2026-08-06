import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { getUserAvatar } from "./avatar";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "owner@yourbusiness.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        try {
          // Check if user exists in database
          const users = await sql`
            SELECT id, email, name, password_hash, image 
            FROM users 
            WHERE email = ${email}
            LIMIT 1;
          `;

          if (users.length === 0) {
            throw new Error("No account found with this email. Please register first.");
          }

          const user = users[0];

          if (!user.password_hash) {
            throw new Error("Account has no password set. Please create an account.");
          }

          // Verify bcrypt password
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            throw new Error("Invalid password. Please check and try again.");
          }

          // Ensure user has a permanent avatar saved in DB
          let userAvatar = user.image;
          if (!userAvatar) {
            userAvatar = getUserAvatar(user.email || user.name || user.id);
            await sql`UPDATE users SET image = ${userAvatar} WHERE id = ${user.id};`;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || "Business Owner",
            image: userAvatar,
          };
        } catch (error: any) {
          console.error("[Auth Authorize Error]:", error.message || error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) (session.user as any).id = token.id;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET || "adreel_super_secret_session_key_2026_marketing_ai",
};
