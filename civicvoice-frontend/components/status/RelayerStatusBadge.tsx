'use client';

import { useFhevm } from '@/fhevm/FhevmProvider';

const statusMap: Record<string, { label: string; tone: 'ready' | 'warn' | 'error' | 'idle' }> = {
  idle: { label: 'FHE idle', tone: 'idle' },
  loading: { label: 'FHE initialising…', tone: 'warn' },
  ready: { label: 'FHE ready', tone: 'ready' },
  error: { label: 'FHE error', tone: 'error' },
};

export function RelayerStatusBadge() {
  const { status, mode, error } = useFhevm();
  const info = statusMap[status] ?? statusMap.idle;

  const caption = mode ? (mode === 'mock' ? 'Mock relayer' : 'Relayer') : 'Unavailable';

  return (
    <div className={`cv-relayer-badge cv-relayer-badge--${info.tone}`} aria-live="polite">
      <span className="cv-relayer-badge__dot" aria-hidden />
      <span className="cv-relayer-badge__label">{info.label}</span>
      <span className="cv-relayer-badge__caption">{caption}</span>
      {status === 'error' && error && <span className="cv-relayer-badge__error">{error}</span>}
    </div>
  );
}


