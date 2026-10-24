import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { tipFailure } from './errors.ts'

export function shortenAddress(address: string, size = 4): string {
  if (size < 1 || address.length <= size * 2 + 1) return address
  return `${address.slice(0, size)}…${address.slice(-size)}`
}

export function formatLamportsAsSol(lamports: number): string {
  if (!Number.isInteger(lamports) || lamports < 0) {
    throw tipFailure('invalid_amount', 'Lamports must be a non-negative integer.')
  }
  const perSol = BigInt(LAMPORTS_PER_SOL)
  const value = BigInt(lamports)
  const whole = value / perSol
  const fraction = value % perSol
  if (fraction === 0n) return whole.toString()
  const fractionText = fraction.toString().padStart(9, '0').replace(/0+$/, '')
  return `${whole.toString()}.${fractionText}`
}

export function formatBlockTime(blockTime: number | null): string {
  if (blockTime === null) return 'Time unknown'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(blockTime * 1000))
}
