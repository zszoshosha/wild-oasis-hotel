import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createGuest, getGuest } from "./data-service";

const authConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      return !!auth?.user;
    },
    async signIn() {
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user?.email)
        try {
          let guest = await getGuest(user.email);

          if (!guest) {
            guest = await createGuest({
              email: user.email,
              fullName: user.name,
            });
          }

          token.guestId = guest.id;
        } catch (error) {
          console.error("[auth] jwt callback error:", error);
        }

      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.guestId = token.guestId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
