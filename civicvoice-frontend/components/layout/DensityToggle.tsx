'use client';

import { useDensity } from '@/hooks/useDensityMode';

export function DensityToggle() {
  const { density, toggleDensity } = useDensity();

  const nextMode = density === 'compact' ? 'comfortable' : 'compact';

  return (
    <button
      type="button"
      className="cv-density-toggle"
      onClick={toggleDensity}
      aria-label={`Switch to ${nextMode} density`}
    >
      <span aria-hidden>Density</span>
      <span className="cv-density-toggle__value">{density === 'compact' ? 'Compact' : 'Comfortable'}</span>
    </button>
  );
}


