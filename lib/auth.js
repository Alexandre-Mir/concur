import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const users = [
          {
            id: '1',
            name: process.env.USER1_NAME || 'alexandre',
            password: process.env.USER1_PASS || '123ale',
          },
          {
            id: '2',
            name: process.env.USER2_NAME || 'kelly',
            password: process.env.USER2_PASS || '123ke',
          },
        ];

        const user = users.find(
          (u) =>
            u.name === credentials?.username &&
            u.password === credentials?.password
        );

        if (user) {
          return { id: user.id, name: user.name };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'sedes-study-secret-key-2026',
};
