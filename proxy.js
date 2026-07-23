import withAuth from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/',
  },
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
