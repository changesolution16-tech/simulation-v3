import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    username?: string;
    institution?: string;
    department?: string;
    position?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    username?: string;
    institution?: string;
    department?: string;
    position?: string;
  }
}
