import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateLastLogin, incrementFailedLogins } from './db-helpers';

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

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.is_active) {
          throw new Error('Account is deactivated');
        }

        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
          throw new Error('Account is temporarily locked. Please try again later.');
        }

        const passwordHash = await bcrypt.hash(credentials.password, 10);
        const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);

        if (!isPasswordValid) {
          await incrementFailedLogins(user.id);
          throw new Error('Invalid email or password');
        }

        await updateLastLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role === 'learner' ? 'student' : user.role,
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
        token.role = user.role;
        token.username = user.username;
        token.institution = user.institution;
        token.department = user.department;
        token.position = user.position;
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
