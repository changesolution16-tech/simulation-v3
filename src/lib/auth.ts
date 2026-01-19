import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateLastLogin, incrementFailedLogins } from './db-helpers';
import { normalizeRole } from './roles';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await getUserByEmail(credentials.email);
        console.log(user);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.is_active) {
          throw new Error('Account is deactivated');
        }

        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
          throw new Error('Account is temporarily locked. Please try again later.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isPasswordValid) {
          await incrementFailedLogins(user.id);
          throw new Error('Invalid email or password');
        }

        await updateLastLogin(user.id);

        const normalizedRole = normalizeRole(user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: normalizedRole,
          username: user.username,
          institution: user.institution,
          department: user.department,
          position: user.position,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeRole(user.role as string);
        token.username = user.username;
        token.institution = user.institution;
        token.department = user.department;
        token.position = user.position;
      }
      if (token.role) {
        token.role = normalizeRole(token.role as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.institution = token.institution as string;
        session.user.department = token.department as string;
        session.user.position = token.position as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
