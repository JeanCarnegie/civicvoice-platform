'use client';

import { FormEvent, useMemo, useState } from 'react';

import { civicCategories } from '@/design/design-tokens';
import { useFhevm } from '@/fhevm/FhevmProvider';
import { EncryptionDebugger } from '@/components/debug/EncryptionDebugger';
import { storeEncryptedComment } from '@/lib/storage/commentStorage';
import { useAggregatesForCategories, useCivicVoice } from '@/hooks/useCivicVoice';

import { ScoreForm } from './ScoreForm';

export function SubmitClient() {
  const { submitScore, allowDecryptAll, decryptAggregate, wallet, deployment } = useCivicVoice();
  const fhevm = useFhevm();
  const aggregateQueries = useAggregatesForCategories(civicCategories.map((category) => category.id));

  const [categoryId, setCategoryId] = useState(0);
  const [score, setScore] = useState(7);
  const [comment, setComment] = useState('');
  const [decryptedAverage, setDecryptedAverage] = useState<number | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugPayload, setDebugPayload] = useState<{ handle: string; proof: string } | null>(null);

  const canSubmit = wallet.connected && fhevm.status === 'ready';
  const statusLabel = submitScore.isPending
    ? 'Encrypting & submitting…'
    : submitScore.isSuccess
    ? 'Submission confirmed'
    : 'Idle';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const result = await submitScore.mutateAsync({ categoryId, value: score });
    if (result?.encrypted) {
      setDebugPayload(result.encrypted);
      setDebugOpen(true);
    }
    if (comment.trim() && wallet.accounts[0]) {
      await storeEncryptedComment(wallet.accounts[0], comment.trim());
      setComment('');
    }
  };

  const handleDecryptPreview = async () => {
    const query = aggregateQueries.find((entry) => entry.data?.categoryId === categoryId);
    if (!query?.data) {
      setDecryptError('Aggregate not available yet. Submit a score first.');
      return;
    }
    setDecrypting(true);
    setDecryptError(null);
    try {
      const result = await decryptAggregate(categoryId, query.data);
      setDecryptedAverage(result.average);
    } catch (error) {
      const errorMessage = (error as Error).message;
      // Check if it's an authorization error
      if (errorMessage.includes('not authorized') || errorMessage.includes('authorized')) {
        setDecryptError(
          'Authorization required. Please click "Authorize averages" first to grant decryption permission.',
        );
      } else {
        setDecryptError(errorMessage);
      }
    } finally {
      setDecrypting(false);
    }
  };

  const submissionHint = useMemo(() => {
    if (!wallet.connected) return 'Connect a wallet to submit private feedback.';
    if (fhevm.status !== 'ready') return 'Waiting for FHE instance to initialise…';
    return 'Scores are encrypted locally and aggregated on-chain.';
  }, [wallet.connected, fhevm.status]);

  return (
    <div className="cv-container cv-submit">
      <header className="cv-page-header">
        <h1>Submit encrypted civic feedback</h1>
        <p>
          Choose a service category, select your satisfaction score, and optionally attach a private comment (stored
          off-chain).
        </p>
        <dl className="cv-meta">
          <div>
            <dt>Active chain</dt>
            <dd>{deployment?.chainName ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Encryption status</dt>
            <dd>{fhevm.status === 'ready' ? 'Ready' : fhevm.status}</dd>
          </div>
          <div>
            <dt>Wallet</dt>
            <dd>{wallet.accounts[0] ? wallet.accounts[0] : 'Not connected'}</dd>
          </div>
        </dl>
      </header>

      <section className="cv-form-card">
        <ScoreForm
          categoryId={categoryId}
          score={score}
          comment={comment}
          onCategoryChange={setCategoryId}
          onScoreChange={setScore}
          onCommentChange={setComment}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          isSubmitting={submitScore.isPending}
          submissionHint={submissionHint}
        />

        <aside className="cv-status-panel">
          <h2>Submission status</h2>
          <ul>
            <li>
              <span>State</span>
              <strong>{statusLabel}</strong>
            </li>
            {submitScore.data?.hash && (
              <li>
                <span>Transaction</span>
                <strong className="cv-code">{submitScore.data.hash}</strong>
              </li>
            )}
          </ul>

          <div className="cv-status-panel__actions">
            <button
              type="button"
              className="cv-button cv-button--ghost"
              onClick={() => allowDecryptAll.mutateAsync()}
              disabled={allowDecryptAll.isPending || !wallet.accounts[0]}
            >
              {allowDecryptAll.isPending ? 'Authorizing…' : 'Authorize averages'}
            </button>
            <button
              type="button"
              className="cv-button cv-button--secondary"
              onClick={handleDecryptPreview}
              disabled={decrypting || !wallet.accounts[0]}
            >
              {decrypting ? 'Decrypting…' : 'Decrypt current average'}
            </button>
          </div>
          {decryptedAverage !== null && (
            <p className="cv-result">Current average: {decryptedAverage.toFixed(2)} / 10</p>
          )}
          {decryptError && <p className="cv-error">{decryptError}</p>}
        </aside>
      </section>
      <EncryptionDebugger open={debugOpen} payload={debugPayload} onClose={() => setDebugOpen(false)} />
    </div>
  );
}

