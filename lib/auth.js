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
            name: process.env.USER1_NAME,
            password: process.env.USER1_PASS,
          },
          {
            id: '2',
            name: process.env.USER2_NAME,
            password: process.env.USER2_PASS,
          },
        ];

        const user = users.find(
          (u) =>
            u.name === credentials.username &&
            u.password === credentials.password
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
      session.user.id = token.id;
      session.user.name = token.name;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
