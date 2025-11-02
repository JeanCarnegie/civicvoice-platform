import Link from "next/link";

const phases = [
  {
    title: "1 · Key provisioning",
    description:
      "Relayer SDK initialises TFHE parameters, retrieves ACL/KMS contracts, and caches the public key for encryption.",
  },
  {
    title: "2 · Encrypted submission",
    description:
      "Residents encrypt their score locally with the relayer key, append the zk input proof, and call submitScore().",
  },
  {
    title: "3 · Homomorphic aggregation",
    description:
      "The CivicVoice contract converts external handles, adds to encrypted sums and counts, and reauthorises ACL.",
  },
  {
    title: "4 · Decryption workflow",
    description:
      "Analysts sign an EIP-712 grant via allowDecryptAverageFor(), then relayer/KMS decrypts aggregates for dashboards.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="cv-container cv-how">
      <header className="cv-page-header">
        <h1>FHEVM workflow overview</h1>
        <p>
          CivicVoice keeps individual feedback private while producing actionable municipal insights. The flow below shows
          each step from wallet connection to public dashboards.
        </p>
      </header>

      <section className="cv-how__grid">
        {phases.map((phase) => (
          <article key={phase.title} className="cv-card">
            <h2>{phase.title}</h2>
            <p>{phase.description}</p>
          </article>
        ))}
      </section>

      <section className="cv-callout">
        <h2>Developer checklist</h2>
        <ul className="cv-list">
          <li>Run <code>npx hardhat compile && npx hardhat test</code> to verify contract logic.</li>
          <li>Use <code>npm run genabi</code> whenever new deployments are produced.</li>
          <li>
            Start a local node with <code>npx hardhat node</code>, then <code>npm run dev:mock</code> for end-to-end tests.
          </li>
          <li>
            Prior to shipping, execute <code>npm run check:static</code> and <code>npm run build</code> to ensure static export
            compliance.
          </li>
        </ul>
        <Link href="/reports" className="cv-button cv-button--primary">
          View encrypted analytics
        </Link>
      </section>
    </div>
  );
}


