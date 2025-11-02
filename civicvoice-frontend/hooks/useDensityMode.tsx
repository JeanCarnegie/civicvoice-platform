'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { DensityScale } from '@/design/design-tokens';

const STORAGE_KEY = 'civicvoice.ui.density';

type DensityContextValue = {
  density: DensityScale;
  setDensity: (density: DensityScale) => void;
  toggleDensity: () => void;
};

const DensityContext = createContext<DensityContextValue | undefined>(undefined);

const defaultDensity: DensityScale = 'comfortable';

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<DensityScale>(defaultDensity);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as DensityScale | null;
    if (stored === 'compact' || stored === 'comfortable') {
      setDensityState(stored);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((value: DensityScale) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  const setDensity = useCallback((value: DensityScale) => {
    setDensityState(value);
    persist(value);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState((current) => {
      const next = current === 'compact' ? 'comfortable' : 'compact';
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(
    () => ({ density: density ?? defaultDensity, setDensity, toggleDensity }),
    [density, setDensity, toggleDensity],
  );

  if (!hydrated && typeof window === 'undefined') {
    return <>{children}</>;
  }

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (!context) {
    return {
      density: defaultDensity,
      setDensity: () => undefined,
      toggleDensity: () => undefined,
    };
  }
  return context;
}

