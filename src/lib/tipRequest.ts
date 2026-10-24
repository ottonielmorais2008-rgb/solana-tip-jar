import { assertSolanaAddress } from './address.ts'
import { FEE_BUFFER_LAMPORTS, parseSolToLamports } from './amount.ts'
import { TipFailure, tipFailure } from './errors.ts'
import { normalizeMemo } from './memo.ts'

export interface PreparedTip {
  payer: string
  recipient: string
  lamports: number
  memo: string | null
}

export function prepareTip(input: {
  payer: string | null
  recipient: string
  amountSol: string
  balanceLamports: number | null
  memo: string
}): PreparedTip {
  if (!input.payer?.trim()) {
    throw tipFailure('wallet_not_connected')
  }

  let payer: string
  try {
    payer = assertSolanaAddress(input.payer)
  } catch (error) {
    if (error instanceof TipFailure && error.code === 'invalid_address') {
      throw tipFailure('wallet_not_connected', 'The connected wallet address is not valid.')
    }
    throw error
  }

  let recipient: string
  try {
    recipient = assertSolanaAddress(input.recipient)
  } catch (error) {
    if (error instanceof TipFailure && error.code === 'invalid_address') {
      throw tipFailure('invalid_address', 'The tip link address is not a valid Solana wallet.')
    }
    throw error
  }

  if (payer === recipient) {
    throw tipFailure('self_tip')
  }

  const lamports = parseSolToLamports(input.amountSol)
  const memo = normalizeMemo(input.memo)
  if (
    input.balanceLamports === null ||
    !Number.isInteger(input.balanceLamports) ||
    input.balanceLamports < 0
  ) {
    throw tipFailure('rpc_failed', 'The devnet balance is not available yet, so the tip was not sent.')
  }
  if (input.balanceLamports < lamports + FEE_BUFFER_LAMPORTS) {
    throw tipFailure('insufficient_balance')
  }

  return { payer, recipient, lamports, memo }
}
