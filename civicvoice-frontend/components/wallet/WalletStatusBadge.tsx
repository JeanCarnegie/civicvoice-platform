'use client';

import { useWallet } from '@/hooks/useWalletContext';

export function WalletStatusBadge() {
  const wallet = useWallet();
  const status = wallet.connected ? 'Connected' : 'Disconnected';
  const account = wallet.accounts[0] ? `${wallet.accounts[0].slice(0, 6)}…${wallet.accounts[0].slice(-4)}` : '—';

  return (
    <div className="cv-wallet-badge" aria-live="polite">
      <span className={`cv-wallet-badge__dot ${wallet.connected ? 'is-connected' : ''}`} aria-hidden />
      <span className="cv-wallet-badge__status">{status}</span>
      <span className="cv-wallet-badge__account">{account}</span>
    </div>
  );
}


