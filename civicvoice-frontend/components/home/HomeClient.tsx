'use client';

import Link from 'next/link';

import { civicCategories } from '@/design/design-tokens';
import { AggregateCard } from '@/components/reports/AggregateCard';
import { WalletStatusBadge } from '@/components/wallet/WalletStatusBadge';
import { useFhevm } from '@/fhevm/FhevmProvider';
import { useAggregatesForCategories, useCivicVoice } from '@/hooks/useCivicVoice';
import { useWallet } from '@/hooks/useWalletContext';

/**
 * Home page client component
 * Displays encrypted satisfaction snapshots and system status
 */
export function HomeClient() {
  const wallet = useWallet();
  const fhevm = useFhevm();
  const civicVoice = useCivicVoice();
  const aggregateQueries = useAggregatesForCategories(civicCategories.map((category) => category.id));

  return (
    <div className="cv-container cv-home">
      <section className="cv-hero">
        <div className="cv-hero__content">
          <span className="cv-label">Encrypted municipal feedback</span>
          <h1>Hear every voice without exposing anyone.</h1>
          <p>
            CivicVoice blends fully homomorphic encryption with transparent reporting, so your residents can rate
            services privately while leaders track real-time satisfaction.
          </p>
          <div className="cv-hero__actions">
            <Link href="/submit" className="cv-button cv-button--primary">
              Submit encrypted feedback
            </Link>
            <Link href="/reports" className="cv-button cv-button--ghost">
              Explore public reports
            </Link>
          </div>
        </div>
        <div className="cv-hero__panel">
          <div className="cv-status-card">
            <h2>Environment status</h2>
            <WalletStatusBadge />
            <ul>
              <li>
                <span>Wallet</span>
                <strong>{wallet.connected ? 'Connected' : 'Disconnected'}</strong>
              </li>
              <li>
                <span>FHE pipeline</span>
                <strong>{fhevm.status === 'ready' ? `Ready (${fhevm.mode ?? 'unknown'})` : fhevm.status}</strong>
              </li>
              <li>
                <span>Active network</span>
                <strong>{civicVoice.deployment?.chainName ?? `Chain ${wallet.chainId ?? '—'}`}</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-section">
        <header>
          <h2>Encrypted satisfaction snapshots</h2>
          <p>
            Each category shows an encrypted aggregate. Connect your wallet and authorize decryption to reveal clear
            averages.
          </p>
        </header>
        <div className="cv-grid">
          {civicCategories.map((category, index) => {
            const query = aggregateQueries[index];
            const encryptedSum = query?.data?.sumHandle;
            const encryptedCount = query?.data?.countHandle;
            const awaiting = query?.isFetching ? 'Refreshing…' : 'Encrypted';
            return (
              <AggregateCard
                key={category.id}
                title={category.label}
                identifier={`ID ${category.id}`}
                encryptedSum={encryptedSum ?? '—'}
                encryptedCount={encryptedCount ?? '—'}
                footer={awaiting}
              />
            );
          })}
        </div>
      </section>

      <section className="cv-section cv-section--two-col">
        <div>
          <h2>How CivicVoice works</h2>
          <ol className="cv-steps">
            <li>
              Residents encrypt their score locally—CivicVoice never sees the clear rating.
            </li>
            <li>
              The FHE smart contract aggregates encrypted sums and counts per service category.
            </li>
            <li>
              Analysts authorize a relayer to decrypt aggregated averages, never individual inputs.
            </li>
            <li>
              Public dashboards stay continuously updated while respecting individual privacy.
            </li>
          </ol>
        </div>
        <div className="cv-callout">
          <h3>Next steps</h3>
          <p>
            Run <code>npm run dev:mock</code> for local iterations or <code>npm run dev</code> to connect to your
            relayer. Generate ABI files anytime with <code>npm run genabi</code>.
          </p>
          <Link href="/how-it-works" className="cv-button cv-button--secondary">
            Learn the technical architecture
          </Link>
        </div>
      </section>
    </div>
  );
}

