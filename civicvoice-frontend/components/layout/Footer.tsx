export function Footer() {
  return (
    <footer className="cv-footer" role="contentinfo">
      <div className="cv-container cv-footer__inner">
        <div>
          <span className="cv-footer__brand">CivicVoice</span>
          <span className="cv-footer__meta">Encrypted civic feedback platform</span>
        </div>
        <div className="cv-footer__links">
          <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noreferrer">
            FHEVM Docs
          </a>
          <a href="https://github.com/zama-ai" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="mailto:support@civicvoice.city">Support</a>
        </div>
      </div>
    </footer>
  );
}


