import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { tipFailure } from './errors.ts'

const SOL_AMOUNT = /^(?:0|[1-9]\d*)(?:\.(\d{1,9}))?$/

export const MAX_TIP_SOL = 5
export const AIRDROP_SOL = 1
export const FEE_BUFFER_LAMPORTS = 5_000
export const TIP_PRESETS = ['0.05', '0.1', '0.25', '1'] as const

export function parseSolToLamports(input: string): number {
  const trimmed = input.trim()
  if (!trimmed) {
    throw tipFailure('invalid_amount', 'Enter a SOL amount.')
  }
  if (!SOL_AMOUNT.test(trimmed)) {
    throw tipFailure('invalid_amount')
  }

  const [whole, fraction = ''] = trimmed.split('.')
  const padded = fraction.padEnd(9, '0')
  const lamports = BigInt(whole) * BigInt(LAMPORTS_PER_SOL) + BigInt(padded)
  if (lamports <= 0n) {
    throw tipFailure('invalid_amount', 'Enter a SOL amount greater than 0.')
  }

  const max = BigInt(MAX_TIP_SOL) * BigInt(LAMPORTS_PER_SOL)
  if (lamports > max || lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw tipFailure('invalid_amount', `Enter at most ${MAX_TIP_SOL} SOL.`)
  }
  return Number(lamports)
}
