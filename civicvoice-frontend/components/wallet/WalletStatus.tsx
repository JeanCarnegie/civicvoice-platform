'use client';

import { useState } from 'react';

import { useWallet } from '@/hooks/useWalletContext';

/**
 * Truncates Ethereum address for display
 * @param address - Full Ethereum address
 * @returns Truncated address (first 6 + last 4 chars)
 */
function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletStatus() {
  const wallet = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryAccount = wallet.accounts[0];
  const chainLabel = wallet.chainId ? `Chain ${wallet.chainId}` : 'No chain';

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  const handleConnect = async (connectorId: string) => {
    closeMenu();
    await wallet.connect(connectorId);
  };

  const handleDisconnect = () => {
    closeMenu();
    wallet.disconnect();
  };

  const renderConnectors = () => (
    <ul className="cv-wallet-menu" role="menu">
      {wallet.connectors.map((connector) => (
        <li key={connector.id} role="none">
          <button
            type="button"
            role="menuitem"
            className="cv-wallet-menu__item"
            onClick={() => handleConnect(connector.id)}
          >
            {connector.icon && <img src={connector.icon} alt="" aria-hidden className="cv-wallet-menu__icon" />}
            <span>{connector.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  if (!wallet.connected) {
    return (
      <div className="cv-wallet" data-state="disconnected">
        <button type="button" className="cv-wallet__button" onClick={toggleMenu} disabled={wallet.isConnecting}>
          {wallet.isConnecting ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {menuOpen && renderConnectors()}
        {wallet.lastError && <p className="cv-wallet__error">{wallet.lastError}</p>}
      </div>
    );
  }

  return (
    <div className="cv-wallet" data-state="connected">
      <button type="button" className="cv-wallet__pill" onClick={toggleMenu} aria-haspopup="menu" aria-expanded={menuOpen}>
        <span className="cv-wallet__status-dot" aria-hidden />
        <span className="cv-wallet__account">{primaryAccount ? truncateAddress(primaryAccount) : 'Connected'}</span>
        <span className="cv-wallet__chain">{chainLabel}</span>
      </button>
      {menuOpen && (
        <div className="cv-wallet-menu cv-wallet-menu--connected" role="menu">
          <button type="button" className="cv-wallet-menu__item" role="menuitem" onClick={handleDisconnect}>
            Disconnect
          </button>
          <div className="cv-wallet-menu__section" role="none">
            <span className="cv-wallet-menu__section-title">Switch connector</span>
            <ul role="none">
              {wallet.connectors.map((connector) => (
                <li key={connector.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="cv-wallet-menu__item"
                    onClick={() => handleConnect(connector.id)}
                  >
                    {connector.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}


