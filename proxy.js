import withAuth from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'sedes-study-secret-key-2026',
});

export const config = {
  matcher: [
    // Protege todas as rotas internas, mas permite a raiz / (onde fica o login)
    '/dashboard/:path*',
    '/edital/:path*',
    '/flashcards/:path*',
    '/simulados/:path*',
    '/estudos/:path*',
    '/progresso/:path*',
  ],
};
