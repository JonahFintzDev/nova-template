import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { db } from './database';
import { config } from './config';

// Extend the User type to include custom fields
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string | null;
    backupCodes?: string[] | null;
  }

  interface Session {
    user: User;
    sessionToken?: string;
  }
}

// Custom session interface
export interface NextAuthSession {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string | null;
    backupCodes?: string[] | null;
  };
  sessionToken?: string;
}

// Credentials provider for email/password login
export const authOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Try to find user by username or email
        const user = await db.user.findFirst({
          where: {
            OR: [{ username }, { email: username }],
          },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            isAdmin: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            backupCodes: true,
            emailVerified: true,
          },
        });

        if (!user) {
          throw new Error('Invalid username or password');
        }

        // Check if password is valid
        const isValidPassword = user.password ? await compare(password, user.password) : false;

        if (!isValidPassword) {
          throw new Error('Invalid username or password');
        }

        // Return user without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...userWithoutPassword } = user;

        return {
          ...userWithoutPassword,
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorSecret: user.twoFactorSecret,
          backupCodes: user.backupCodes,
        };
      },
    }),
  ],
  secret: config.nextauthSecret,
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    secret: config.nextauthSecret,
    encryption: true,
  },
  callbacks: {
    async jwt({ token, user, session, trigger }: any) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.twoFactorSecret = user.twoFactorSecret;
        token.backupCodes = user.backupCodes;
      }

      // Update token from session on update
      if (trigger === 'update' && session) {
        token.id = session.user.id;
        token.email = session.user.email;
        token.username = session.user.username;
        token.isAdmin = session.user.isAdmin;
        token.twoFactorEnabled = session.user.twoFactorEnabled;
      }

      return token;
    },
    async session({ session, token }: any) {
      // Add user info to session
      session.user = {
        id: token.id,
        email: token.email,
        username: token.username,
        isAdmin: token.isAdmin,
        twoFactorEnabled: token.twoFactorEnabled,
        twoFactorSecret: token.twoFactorSecret,
        backupCodes: token.backupCodes,
      };
      session.sessionToken = token.sessionToken;

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

// Initialize NextAuth
export const nextAuthHandler = NextAuth(authOptions);

// Helper to get session
export const getSession = async (token: string): Promise<NextAuthSession | null> => {
  try {
    // For now, we'll use the existing JWT approach
    // and gradually migrate to NextAuth sessions
    const user = await db.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? '',
        username: user.username,
        isAdmin: user.isAdmin,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret,
        backupCodes: user.backupCodes,
      },
    };
  } catch {
    return null;
  }
};
