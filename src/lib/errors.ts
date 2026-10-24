export type TipErrorCode =
  | 'wallet_not_connected'
  | 'insufficient_balance'
  | 'user_rejected'
  | 'invalid_address'
  | 'invalid_amount'
  | 'memo_too_long'
  | 'self_tip'
  | 'wrong_network'
  | 'rpc_failed'
  | 'invalid_profile'
  | 'unknown'

const FRIENDLY_CODES = new Set<TipErrorCode>([
  'user_rejected',
  'insufficient_balance',
  'invalid_address',
  'wallet_not_connected',
  'wrong_network',
])

export class TipFailure extends Error {
  readonly code: TipErrorCode

  constructor(code: TipErrorCode, message: string) {
    super(message)
    this.name = 'TipFailure'
    this.code = code
  }
}

export function messageForTipError(code: TipErrorCode): string {
  switch (code) {
    case 'wallet_not_connected':
      return 'Connect a Phantom wallet before sending a tip.'
    case 'insufficient_balance':
      return 'This wallet does not have enough devnet SOL to cover the tip and the network fee.'
    case 'user_rejected':
      return 'The wallet request was rejected before it was sent.'
    case 'invalid_address':
      return 'That Solana address is not a valid wallet address.'
    case 'invalid_amount':
      return 'Enter a SOL amount greater than 0 with at most 9 decimal places.'
    case 'memo_too_long':
      return 'That memo is too long for a Solana transaction.'
    case 'self_tip':
      return 'Choose another address. A wallet cannot tip itself.'
    case 'wrong_network':
      return 'This app only talks to Solana devnet.'
    case 'rpc_failed':
      return 'The devnet request failed. Try again in a moment.'
    case 'invalid_profile':
      return 'The display name or note is too long.'
    case 'unknown':
      return 'Something went wrong while preparing the tip.'
    default: {
      const exhaustive: never = code
      return exhaustive
    }
  }
}

export function tipFailure(code: TipErrorCode, message?: string): TipFailure {
  return new TipFailure(code, message ?? messageForTipError(code))
}

export function classifyTipError(error: unknown): { code: TipErrorCode; message: string } {
  if (error instanceof TipFailure) {
    return { code: error.code, message: error.message }
  }

  const raw = readErrorMessage(error)
  const code = matchCode(`${raw} ${readErrorCode(error)}`.toLowerCase())
  if (FRIENDLY_CODES.has(code)) {
    return { code, message: messageForTipError(code) }
  }
  return { code, message: safeDetail(raw) || messageForTipError(code) }
}

function matchCode(blob: string): TipErrorCode {
  if (/reject|denied|user cancell?ed|\b4001\b/.test(blob)) return 'user_rejected'
  if (blob.includes('insufficient')) return 'insufficient_balance'
  if (/invalid public key|non-base58|invalid address|invalid base58/.test(blob)) return 'invalid_address'
  if (/wallet not connected|no solana account/.test(blob)) return 'wallet_not_connected'
  if (/mainnet|wrong network|network mismatch/.test(blob)) return 'wrong_network'
  if (/failed to fetch|network request|timeout|timed out|blockhash|429|503|econn|fetch failed|airdrop/.test(blob)) {
    return 'rpc_failed'
  }
  return 'unknown'
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (isRecord(error) && typeof error.message === 'string') return error.message
  return ''
}

function readErrorCode(error: unknown): string {
  if (!isRecord(error)) return ''
  const code = error.code
  if (typeof code === 'number' || typeof code === 'string') return String(code)
  return ''
}

function safeDetail(message: string): string {
  const cleaned = message.replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length > 180) return ''
  return cleaned
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
