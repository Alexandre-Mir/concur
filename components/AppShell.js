'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

function ShellContent({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/';
  const isLoading = status === 'loading';
  
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }
  
  if (isLoginPage || !session) {
    return <>{children}</>;
  }
  
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <SessionProvider>
      <ShellContent>{children}</ShellContent>
    </SessionProvider>
  );
}
