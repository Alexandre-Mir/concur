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
        const inputUser = (credentials?.username || '').trim().toLowerCase();
        const inputPass = (credentials?.password || '').trim();

        const user1Name = (process.env.USER1_NAME || 'alexandre').trim().toLowerCase();
        const user1Pass = (process.env.USER1_PASS || '123ale').trim();
        const user2Name = (process.env.USER2_NAME || 'kelly').trim().toLowerCase();
        const user2Pass = (process.env.USER2_PASS || '123ke').trim();

        const users = [
          { id: '1', displayName: 'alexandre', matchNames: [user1Name, 'alexandre'], pass: user1Pass },
          { id: '2', displayName: 'kelly', matchNames: [user2Name, 'kelly'], pass: user2Pass },
        ];

        const user = users.find(
          (u) =>
            u.matchNames.includes(inputUser) &&
            inputPass === u.pass
        );

        if (user) {
          return { id: user.id, name: user.displayName };
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
