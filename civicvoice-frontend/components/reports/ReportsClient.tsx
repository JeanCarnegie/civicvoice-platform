'use client';

import { useState } from 'react';

import { civicCategories } from '@/design/design-tokens';
import { TrendChart } from '@/components/charts/TrendChart';
import { CategoryRadar } from '@/components/reports/CategoryRadar';
import { useAggregatesForCategories, useCivicVoice } from '@/hooks/useCivicVoice';

type HistoryState = Record<number, number[]>;

const MAX_HISTORY = 30;

export function ReportsClient() {
  const civicVoice = useCivicVoice();
  const aggregateQueries = useAggregatesForCategories(civicCategories.map((category) => category.id));
  const [history, setHistory] = useState<HistoryState>({});
  const [averages, setAverages] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [globalPending, setGlobalPending] = useState(false);

  const handleDecryptAll = async () => {
    if (!civicVoice.wallet.accounts[0]) {
      setErrors(() =>
        civicCategories.reduce<Record<number, string>>((acc, category) => {
          acc[category.id] = 'Connect wallet to decrypt results.';
          return acc;
        }, {}),
      );
      return;
    }

    setGlobalPending(true);
    try {
      const results = await Promise.all(
        civicCategories.map(async (category, index) => {
          const data = aggregateQueries[index]?.data;
          if (!data) {
            return { categoryId: category.id, error: 'Encrypted aggregate not yet available.' };
          }
          try {
            const result = await civicVoice.decryptAggregate(category.id, data);
            return { categoryId: category.id, average: result.average };
          } catch (error) {
            return { categoryId: category.id, error: (error as Error).message };
          }
        }),
      );

      setAverages((prev) => {
        const updated = { ...prev };
        results.forEach((res) => {
          if ('average' in res && typeof res.average === 'number') {
            updated[res.categoryId] = res.average;
          }
        });
        return updated;
      });

      setHistory((prev) => {
        const updated = { ...prev };
        results.forEach((res) => {
          if ('average' in res && typeof res.average === 'number') {
            const existing = updated[res.categoryId] ?? [];
            updated[res.categoryId] = [...existing, res.average].slice(-MAX_HISTORY);
          }
        });
        return updated;
      });

      setErrors(() => {
        const next: Record<number, string> = {};
        results.forEach((res) => {
          next[res.categoryId] = 'error' in res ? res.error ?? '' : '';
        });
        return next;
      });
    } finally {
      setGlobalPending(false);
    }
  };

  return (
    <div className="cv-container cv-reports">
      <header className="cv-page-header">
        <h1>Encrypted satisfaction dashboard</h1>
        <p>Monitor aggregated civic sentiment across all service categories. Decrypt averages instantly—no wallet authorisation required.</p>
      </header>

      <div className="cv-radar-wrapper">
        <CategoryRadar
          values={civicCategories.map((category) => ({
            label: category.label,
            value: averages[category.id] ?? 0,
          }))}
        />
        <div className="cv-radar-copy">
          <h2>City sentiment radar</h2>
          <p>
            The polygon highlights the latest decrypted average per service category. Authorise once, decrypt each average，
            and watch the radar update in real time.
          </p>
          <div className="cv-reports__actions">
            <button
              type="button"
              className="cv-button cv-button--primary"
              onClick={() => civicVoice.allowDecryptAll.mutateAsync()}
              disabled={civicVoice.allowDecryptAll.isPending || !civicVoice.wallet.accounts[0]}
            >
              {civicVoice.allowDecryptAll.isPending ? 'Authorizing…' : 'Authorize all categories'}
            </button>
            <button
              type="button"
              className="cv-button cv-button--secondary"
              onClick={handleDecryptAll}
              disabled={globalPending}
            >
              {globalPending ? 'Decrypting…' : 'Decrypt all averages'}
            </button>
          </div>
        </div>
      </div>

      <table className="cv-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Encrypted sum</th>
            <th scope="col">Encrypted count</th>
            <th scope="col">Trend</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {civicCategories.map((category, index) => {
            const query = aggregateQueries[index];
            const sumHandle = query?.data?.sumHandle ?? '—';
            const countHandle = query?.data?.countHandle ?? '—';
            const categoryHistory = history[category.id] ?? [];
            const latestAverage = averages[category.id];

            return (
              <tr key={category.id}>
                <th scope="row">
                  <div className="cv-table__label">
                    <span>{category.label}</span>
                    <span>ID {category.id}</span>
                  </div>
                </th>
                <td className="cv-code">{sumHandle}</td>
                <td className="cv-code">{countHandle}</td>
                <td>
                  {categoryHistory.length > 0 && typeof latestAverage === 'number' ? (
                    <div className="cv-trend">
                      <strong className="cv-trend__value">{latestAverage.toFixed(2)} / 10</strong>
                      <TrendChart values={categoryHistory} label="Avg" />
                    </div>
                  ) : (
                    <span className="cv-hint">Decrypt to reveal trend</span>
                  )}
                </td>
                <td className="cv-table__actions">
                  {errors[category.id] && <span className="cv-error">{errors[category.id]}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

