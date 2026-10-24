import { Link } from 'react-router-dom'
import { shortenAddress } from '../lib/format.ts'
import { buildTipPath } from '../lib/tipLink.ts'
import { useDevnetWallet } from '../phantom/useDevnetWallet.ts'

export function WalletControls() {
  const wallet = useDevnetWallet()

  if (wallet.isLoading && !wallet.isConnected) {
    return <p className="muted">Checking for Phantom…</p>
  }

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="wallet-bar">
        <Link className="chip" to={buildTipPath({ address: wallet.address })}>
          {shortenAddress(wallet.address)}
        </Link>
        <button type="button" className="secondary" onClick={wallet.disconnect} disabled={wallet.isDisconnecting}>
          Disconnect
        </button>
        {wallet.actionError ? (
          <p className="alert" role="alert">
            {wallet.actionError}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="wallet-bar">
      <div className="wallet-actions">
        <button
          type="button"
          onClick={() => void wallet.connectWith('injected')}
          disabled={wallet.isConnecting || !wallet.isExtensionInstalled}
        >
          Phantom extension
        </button>
        {wallet.embeddedLogin ? (
          <>
            <button type="button" className="secondary" onClick={() => void wallet.connectWith('google')} disabled={wallet.isConnecting}>
              Google
            </button>
            <button type="button" className="secondary" onClick={() => void wallet.connectWith('apple')} disabled={wallet.isConnecting}>
              Apple
            </button>
          </>
        ) : null}
      </div>
      {wallet.actionError ? (
        <p className="alert" role="alert">
          {wallet.actionError}
        </p>
      ) : null}
      {!wallet.isExtensionInstalled && !wallet.embeddedLogin ? (
        <p className="muted">
          Install the{' '}
          <a href="https://phantom.com/download" target="_blank" rel="noreferrer">
            Phantom extension
          </a>{' '}
          to connect. Google and Apple embedded wallets appear after you set a public Phantom app id.
        </p>
      ) : (
        <p className="muted">
          {wallet.embeddedLogin
            ? 'Google and Apple create an embedded wallet, so there is no seed phrase to store. The extension works too.'
            : 'The extension connects without an app id.'}
        </p>
      )}
    </div>
  )
}
