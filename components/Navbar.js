'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { getStudyStreak } from '@/lib/flashcards';

const NAV_LINKS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/edital', icon: '📜', label: 'Edital' },
  { href: '/flashcards', icon: '🃏', label: 'Flashcards' },
  { href: '/simulados', icon: '📝', label: 'Simulados' },
  { href: '/estudos', icon: '📖', label: 'Estudos' },
  { href: '/progresso', icon: '📈', label: 'Progresso' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const streak = useMemo(() => {
    if (!mounted || !session?.user?.name) return { currentStreak: 0 };
    return getStudyStreak(session.user.name);
  }, [mounted, session?.user?.name]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="navbar__toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Menu"
        aria-expanded={mobileOpen}
      >
        <span className={`navbar__toggle-icon${mobileOpen ? ' open' : ''}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="navbar__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className={`navbar${mobileOpen ? ' navbar--open' : ''}`}>
        <div className="navbar__logo">
          <span className="navbar__logo-icon">📚</span>
          <span className="navbar__logo-text">SEDES Study</span>
        </div>

        <ul className="navbar__links">
          {NAV_LINKS.map(({ href, icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`navbar__link${isActive(href) ? ' navbar__link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="navbar__link-icon">{icon}</span>
                <span className="navbar__link-label">{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar__user">
          {session?.user && (
            <>
              <div className="navbar__user-info">
                <span className="navbar__user-avatar">
                  {session.user.name?.[0]?.toUpperCase() || '?'}
                </span>
                <div className="navbar__user-details">
                  <span className="navbar__user-name">{session.user.name}</span>
                  {streak.currentStreak > 0 && (
                    <span className="navbar__streak-badge" title={`Sequência de estudos: ${streak.currentStreak} dia(s)`}>
                      🔥 {streak.currentStreak}d
                    </span>
                  )}
                </div>
              </div>
              <button
                className="navbar__logout"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
