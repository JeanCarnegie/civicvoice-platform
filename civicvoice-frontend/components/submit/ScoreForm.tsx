'use client';

import type { FormEvent } from 'react';

import { civicCategories } from '@/design/design-tokens';

type ScoreFormProps = {
  categoryId: number;
  score: number;
  comment: string;
  onCategoryChange: (categoryId: number) => void;
  onScoreChange: (score: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submissionHint: string;
};

const scoreMarks = Array.from({ length: 11 }, (_, value) => value);

export function ScoreForm(props: ScoreFormProps) {
  const {
    categoryId,
    score,
    comment,
    onCategoryChange,
    onScoreChange,
    onCommentChange,
    onSubmit,
    canSubmit,
    isSubmitting,
    submissionHint,
  } = props;

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <legend>Category</legend>
        <select value={categoryId} onChange={(event) => onCategoryChange(Number(event.target.value))}>
          {civicCategories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Satisfaction score</legend>
        <div className="cv-range">
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(event) => onScoreChange(Number(event.target.value))}
          />
          <div className="cv-range__marks">
            {scoreMarks.map((mark) => (
              <span key={mark} data-active={score === mark}>
                {mark}
              </span>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Private comment (optional)</legend>
        <textarea
          placeholder="Share context for city analysts. Your message is encrypted before leaving this device."
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          maxLength={280}
        />
      </fieldset>

      <div className="cv-form-actions">
        <button type="submit" className="cv-button cv-button--primary" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Encrypt & submit'}
        </button>
        <span className="cv-hint">{submissionHint}</span>
      </div>
    </form>
  );
}


