import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Google OAuth — only active when credentials are configured in env
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select(
          "+passwordHash"
        );

        if (!user) throw new Error("No account found with this email");

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) throw new Error("Incorrect password");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Credentials sign-in
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }

      // Google OAuth — look up or create the user in MongoDB on first sign-in
      if (account?.provider === "google" && profile?.email) {
        await connectDB();
        const email  = (profile.email as string).toLowerCase();
        let dbUser   = await User.findOne({ email });
        if (!dbUser) {
          dbUser = await User.create({
            name:         profile.name ?? email.split("@")[0],
            email,
            // Google users never sign in with a password — store an unusable hash
            passwordHash: crypto.randomBytes(32).toString("hex"),
            role:         "user",
          });
        }
        token.id   = dbUser._id.toString();
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
