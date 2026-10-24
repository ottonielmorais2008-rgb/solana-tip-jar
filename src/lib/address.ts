import { PublicKey } from '@solana/web3.js'
import { TipFailure, tipFailure } from './errors.ts'

export function isValidSolanaAddress(value: string): boolean {
  try {
    assertSolanaAddress(value)
    return true
  } catch {
    return false
  }
}

export function assertSolanaAddress(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw tipFailure('invalid_address', 'Enter a Solana address.')
  }

  try {
    const key = new PublicKey(trimmed)
    if (!PublicKey.isOnCurve(key.toBytes())) {
      throw tipFailure('invalid_address')
    }
    return key.toBase58()
  } catch (error) {
    if (error instanceof TipFailure) throw error
    throw tipFailure('invalid_address')
  }
}
