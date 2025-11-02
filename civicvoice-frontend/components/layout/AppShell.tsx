'use client';

import type { ReactNode } from 'react';

import { useDensity } from '@/hooks/useDensityMode';

import { Footer } from './Footer';
import { NavBar } from './NavBar';

export function AppShell({ children }: { children: ReactNode }) {
  const { density } = useDensity();

  return (
    <div className="cv-app-shell" data-density={density}>
      <NavBar />
      <main className="cv-main" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}


