import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSolBalance } from '../chain/useDevnetAccount.ts'
import { AIRDROP_SOL } from '../lib/amount.ts'
import { isValidSolanaAddress } from '../lib/address.ts'
import { classifyTipError } from '../lib/errors.ts'
import { devnetExplorerUrl } from '../lib/devnet.ts'
import { formatLamportsAsSol } from '../lib/format.ts'
import { MAX_DISPLAY_NAME_LENGTH, MAX_PAGE_NOTE_LENGTH, buildTipPath, toAbsoluteTipUrl } from '../lib/tipLink.ts'
import { useDevnetWallet } from '../phantom/useDevnetWallet.ts'

export function HomePage() {
  const wallet = useDevnetWallet()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [recipient, setRecipient] = useState('')
  const [touched, setTouched] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [copyFailureFor, setCopyFailureFor] = useState<string | null>(null)
  const balance = useSolBalance(wallet.address)
  const recipientValue = touched ? recipient : (wallet.address ?? '')

  const link = useMemo(() => {
    if (!recipientValue.trim()) return null
    try {
      const path = buildTipPath({ address: recipientValue, name, note })
      return {
        ok: true as const,
        path,
        url: toAbsoluteTipUrl(path, window.location.origin, import.meta.env.BASE_URL),
      }
    } catch (error) {
      return { ok: false as const, error: classifyTipError(error).message }
    }
  }, [name, note, recipientValue])

  const shareUrl = link?.ok ? link.url : ''
  const copied = copiedUrl === shareUrl && shareUrl !== ''
  const copyError = copyFailureFor === shareUrl ? 'Copy failed. Select the link and copy it manually.' : null

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(shareUrl)
      setCopyFailureFor(null)
    } catch {
      setCopiedUrl(null)
      setCopyFailureFor(shareUrl)
    }
  }

  return (
    <main className="hero-grid">
      <section className="intro">
        <p className="eyebrow">Solana devnet</p>
        <h1>Pass a tip jar around as a link.</h1>
        <p className="lede">
          Connect Phantom, share a page for your wallet, and let someone send test SOL with a short memo. The jar
          lives entirely in the URL.
        </p>
        <ol className="steps">
          <li>Connect the Phantom extension, or Google and Apple when an app id is configured.</li>
          <li>Name the jar and copy the link.</li>
          <li>A visitor connects and sends devnet SOL.</li>
        </ol>
      </section>

      <section className="card stack">
        <div>
          <p className="eyebrow">Your jar</p>
          <h2>Shareable tip link</h2>
        </div>
        <label>
          Display name
          <input
            value={name}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada"
          />
        </label>
        <label>
          Note on the page
          <textarea
            value={note}
            maxLength={MAX_PAGE_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Coffee fund for the demo"
          />
        </label>
        <label>
          Wallet address
          <input
            value={recipientValue}
            spellCheck={false}
            onChange={(event) => {
              setTouched(true)
              setRecipient(event.target.value)
            }}
            placeholder="Connect Phantom or paste a devnet address"
          />
        </label>

        {link && !link.ok ? (
          <p className="alert" role="alert">
            {link.error}
          </p>
        ) : null}
        {link?.ok ? (
          <div className="stack">
            <label>
              Tip link
              <input readOnly value={link.url} aria-label="Tip link" />
            </label>
            <div className="button-row">
              <button type="button" className="amber" onClick={() => void copyLink()}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <Link className="button secondary" to={link.path}>
                Open tip page
              </Link>
            </div>
            {copyError ? (
              <p className="alert" role="alert">
                {copyError}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="muted">Connect Phantom or paste a wallet address to build the link.</p>
        )}

        <div className="airdrop">
          <p>
            Connected balance:{' '}
            <strong>
              {wallet.address && isValidSolanaAddress(wallet.address) && balance.lamports !== null
                ? `${formatLamportsAsSol(balance.lamports)} SOL`
                : '—'}
            </strong>
            {balance.loading ? <span className="muted"> Checking devnet…</span> : null}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => void balance.airdrop()}
            disabled={!wallet.address || balance.airdropPending}
          >
            {balance.airdropPending ? 'Requesting…' : `Get ${AIRDROP_SOL} devnet SOL`}
          </button>
          {balance.error ? (
            <p className="alert" role="alert">
              {balance.error}
            </p>
          ) : null}
          {balance.airdropSignature ? (
            <p className="success">
              Airdrop submitted.{' '}
              <a href={devnetExplorerUrl('tx', balance.airdropSignature)} target="_blank" rel="noreferrer">
                View on Solana Explorer
              </a>
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
