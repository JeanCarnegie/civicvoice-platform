'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

import { civicCategories } from '@/design/design-tokens';

import { DensityToggle } from './DensityToggle';
import { RelayerStatusBadge } from '../status/RelayerStatusBadge';
import { WalletStatus } from '../wallet/WalletStatus';

const links: Array<{ href: Route; label: string }> = [
  { href: '/' as Route, label: 'Home' },
  { href: '/reports' as Route, label: 'Reports' },
  { href: '/submit' as Route, label: 'Submit' },
  { href: '/how-it-works' as Route, label: 'How It Works' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="cv-nav" role="banner">
      <div className="cv-container cv-nav__inner">
        <div className="cv-nav__brand">
          <Link href="/" className="cv-nav__logo" aria-label="CivicVoice home">
            CivicVoice
          </Link>
          <nav aria-label="Primary">
            <ul className="cv-nav__menu">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={isActive ? 'cv-nav__link cv-nav__link--active' : 'cv-nav__link'}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="cv-nav__actions">
          <RelayerStatusBadge />
          <DensityToggle />
          <WalletStatus />
        </div>
      </div>
      <div className="cv-nav__categories" aria-hidden="true">
        <div className="cv-container">
          <span className="cv-nav__categories-label">Focus areas:</span>
          <ul className="cv-nav__categories-list">
            {civicCategories.map((category) => (
              <li key={category.id}>{category.label}</li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

