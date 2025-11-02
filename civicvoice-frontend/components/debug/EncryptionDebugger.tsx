'use client';

type EncryptionDebuggerProps = {
  open: boolean;
  onClose: () => void;
  payload?: {
    handle: string;
    proof: string;
  } | null;
};

export function EncryptionDebugger({ open, onClose, payload }: EncryptionDebuggerProps) {
  if (!open || !payload) {
    return null;
  }

  return (
    <div className="cv-debug">
      <header>
        <strong>Encryption debugger</strong>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}


