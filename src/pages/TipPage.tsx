import { PublicKey } from '@solana/web3.js'
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useDevnetConnection } from '../chain/useDevnetConnection.ts'
import { confirmDevnetSignature } from '../chain/rpc.ts'
import { useRecentTips, useSolBalance } from '../chain/useDevnetAccount.ts'
import { isValidSolanaAddress } from '../lib/address.ts'
import { AIRDROP_SOL, TIP_PRESETS, parseSolToLamports } from '../lib/amount.ts'
import { devnetExplorerUrl } from '../lib/devnet.ts'
import { classifyTipError, tipFailure } from '../lib/errors.ts'
import { formatBlockTime, formatLamportsAsSol, shortenAddress } from '../lib/format.ts'
import { memoByteLength, normalizeMemo } from '../lib/memo.ts'
import { parseTipPath } from '../lib/tipLink.ts'
import { buildTipTransaction } from '../lib/transaction.ts'
import { prepareTip } from '../lib/tipRequest.ts'
import { useDevnetWallet } from '../phantom/useDevnetWallet.ts'

type ConfirmState = 'idle' | 'pending' | 'confirmed' | 'unconfirmed'

export function TipPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const rawAddress = params.address ?? ''
  const parsed = parseTipPath(`/tip/${rawAddress}`, `?${searchParams.toString()}`)
  const address = parsed?.address ?? rawAddress
  const valid = isValidSolanaAddress(address)

  if (!valid) {
    return (
      <main className="card stack">
        <p className="eyebrow">Invalid address</p>
        <h1>This tip link does not point at a Solana wallet.</h1>
        <p className="alert" role="alert">
          {classifyTipError(tipFailure('invalid_address', 'The tip link address is not a valid Solana wallet.')).message}
        </p>
        <Link className="button" to="/">
          Create a new link
        </Link>
      </main>
    )
  }

  return <TipJar address={address} name={parsed?.name ?? ''} note={parsed?.note ?? ''} />
}

function TipJar({ address, name, note }: { address: string; name: string; note: string }) {
  const wallet = useDevnetWallet()
  const connection = useDevnetConnection()
  const jar = useSolBalance(address)
  const visitor = useSolBalance(wallet.address)
  const recent = useRecentTips(address)
  const [amount, setAmount] = useState('0.1')
  const [memo, setMemo] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>('idle')

  const amountError = readAmountError(amount)
  const memoError = readMemoError(memo)
  const selfTip = wallet.address === address

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSignature(null)
    setConfirmState('idle')
    setSending(true)
    try {
      if (!wallet.address) throw tipFailure('wallet_not_connected')
      const prepared = prepareTip({
        payer: wallet.address,
        recipient: address,
        amountSol: amount,
        balanceLamports: visitor.lamports,
        memo,
      })
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      const transaction = buildTipTransaction({
        from: new PublicKey(prepared.payer),
        to: new PublicKey(prepared.recipient),
        lamports: prepared.lamports,
        memo: prepared.memo,
        recentBlockhash: blockhash,
      })
      const result = await wallet.signAndSend(transaction)
      setSignature(result.signature)
      setConfirmState('pending')
      setMemo('')
      try {
        await confirmDevnetSignature(connection, result.signature)
        setConfirmState('confirmed')
      } catch {
        setConfirmState('unconfirmed')
      }
      visitor.refresh()
      jar.refresh()
      recent.refresh()
    } catch (caught) {
      setError(classifyTipError(caught).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="tip-grid">
      <section className="card stack">
        <p className="eyebrow">Tip jar</p>
        <h1>{name || 'Devnet tip jar'}</h1>
        {note ? <blockquote className="note">{note}</blockquote> : null}
        <p className="mono">{address}</p>
        <p>
          <a href={devnetExplorerUrl('address', address)} target="_blank" rel="noreferrer">
            View address on Solana Explorer
          </a>
        </p>
        <p>
          Jar balance:{' '}
          <strong>{jar.lamports === null ? '—' : `${formatLamportsAsSol(jar.lamports)} SOL`}</strong>
          {jar.loading ? <span className="muted"> Checking devnet…</span> : null}
        </p>
        {jar.error ? (
          <p className="alert" role="alert">
            {jar.error}
          </p>
        ) : null}

        <form className="stack" onSubmit={(event) => void onSubmit(event)}>
          <div className="presets" role="group" aria-label="Suggested amounts">
            {TIP_PRESETS.map((preset) => (
              <button key={preset} type="button" aria-pressed={amount === preset} onClick={() => setAmount(preset)}>
                {preset} SOL
              </button>
            ))}
          </div>
          <label>
            Amount in SOL
            <input
              value={amount}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={amountError ? true : undefined}
            />
          </label>
          {amountError ? (
            <p className="alert" role="alert">
              {amountError}
            </p>
          ) : null}
          <label>
            Message
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="Optional note stored in a Solana memo"
              aria-invalid={memoError ? true : undefined}
            />
          </label>
          <p className="muted">{memoByteLength(memo.trim())} bytes</p>
          {memoError ? (
            <p className="alert" role="alert">
              {memoError}
            </p>
          ) : null}
          {selfTip ? <p className="muted">This is your jar. Open the link in another wallet to send a tip.</p> : null}
          <p>
            Your balance:{' '}
            <strong>{visitor.lamports === null ? '—' : `${formatLamportsAsSol(visitor.lamports)} SOL`}</strong>
          </p>
          <div className="button-row">
            <button className="amber" type="submit" disabled={sending || Boolean(amountError || memoError)}>
              {sending ? 'Waiting for Phantom…' : 'Send tip'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => void visitor.airdrop()}
              disabled={!wallet.address || visitor.airdropPending}
            >
              {visitor.airdropPending ? 'Requesting…' : `Get ${AIRDROP_SOL} devnet SOL`}
            </button>
          </div>
          {!wallet.isConnected ? <p className="muted">Connect Phantom in the header before sending.</p> : null}
          {visitor.error ? (
            <p className="alert" role="alert">
              {visitor.error}
            </p>
          ) : null}
          {visitor.airdropSignature ? (
            <p className="success">
              Airdrop submitted.{' '}
              <a href={devnetExplorerUrl('tx', visitor.airdropSignature)} target="_blank" rel="noreferrer">
                View on Solana Explorer
              </a>
            </p>
          ) : null}
          {error ? (
            <p className="alert" role="alert">
              {error}
            </p>
          ) : null}
          {signature ? (
            <div className="success stack">
              <p>{confirmCopy(confirmState)}</p>
              <p className="mono">{signature}</p>
              <a href={devnetExplorerUrl('tx', signature)} target="_blank" rel="noreferrer">
                View transaction on Solana Explorer (devnet)
              </a>
            </div>
          ) : null}
        </form>
      </section>

      <section className="card stack">
        <div className="section-heading">
          <h2>Recent tips</h2>
          <button type="button" className="secondary" onClick={recent.refresh}>
            Refresh
          </button>
        </div>
        {recent.loading ? <p className="muted">Checking devnet…</p> : null}
        {recent.error ? (
          <p className="alert" role="alert">
            {recent.error}
          </p>
        ) : null}
        {!recent.loading && recent.tips.length === 0 ? (
          <p className="muted">No incoming devnet tips showed up in the latest transactions.</p>
        ) : (
          <ul className="tip-list">
            {recent.tips.map((tip) => (
              <li key={tip.signature}>
                <strong>{formatLamportsAsSol(tip.lamports)} SOL</strong>
                <p className="muted">
                  From {shortenAddress(tip.from)} · {formatBlockTime(tip.blockTime)}
                </p>
                {tip.memo ? <p>{tip.memo}</p> : null}
                <a href={devnetExplorerUrl('tx', tip.signature)} target="_blank" rel="noreferrer">
                  Explorer
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function readAmountError(amount: string): string | null {
  if (!amount.trim()) return 'Enter a SOL amount.'
  try {
    parseSolToLamports(amount)
    return null
  } catch (error) {
    return classifyTipError(error).message
  }
}

function readMemoError(memo: string): string | null {
  try {
    normalizeMemo(memo)
    return null
  } catch (error) {
    return classifyTipError(error).message
  }
}

function confirmCopy(state: ConfirmState): string {
  switch (state) {
    case 'idle':
      return 'Transaction submitted.'
    case 'pending':
      return 'Waiting for devnet confirmation.'
    case 'confirmed':
      return 'Confirmed on Solana devnet.'
    case 'unconfirmed':
      return 'Submitted. Devnet has not confirmed it yet. Open the explorer link and check that the wallet is on devnet.'
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}
