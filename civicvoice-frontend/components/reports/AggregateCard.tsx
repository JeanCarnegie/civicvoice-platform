type AggregateCardProps = {
  title: string;
  identifier: string;
  encryptedSum: string;
  encryptedCount: string;
  footer?: string;
};

export function AggregateCard({ title, identifier, encryptedSum, encryptedCount, footer }: AggregateCardProps) {
  return (
    <article className="cv-card">
      <header>
        <h3>{title}</h3>
        <span className="cv-token">{identifier}</span>
      </header>
      <dl>
        <div>
          <dt>Encrypted sum</dt>
          <dd className="cv-code">{encryptedSum}</dd>
        </div>
        <div>
          <dt>Encrypted count</dt>
          <dd className="cv-code">{encryptedCount}</dd>
        </div>
      </dl>
      {footer && <footer>{footer}</footer>}
    </article>
  );
}


