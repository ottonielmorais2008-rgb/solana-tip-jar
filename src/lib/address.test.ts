import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { assertSolanaAddress, isValidSolanaAddress } from './address.ts'
import { TipFailure } from './errors.ts'

describe('Solana addresses', () => {
  it('accepts an on-curve wallet and returns the canonical form', () => {
    const address = Keypair.generate().publicKey.toBase58()
    expect(isValidSolanaAddress(`  ${address}  `)).toBe(true)
    expect(assertSolanaAddress(address)).toBe(address)
  })

  it('rejects empty, malformed, and off-curve addresses', () => {
    expect(isValidSolanaAddress('')).toBe(false)
    expect(isValidSolanaAddress('not-an-address')).toBe(false)
    expect(isValidSolanaAddress('0OIl')).toBe(false)

    const [pda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode('tip-jar')],
      SystemProgram.programId,
    )
    expect(PublicKey.isOnCurve(pda.toBytes())).toBe(false)
    expect(isValidSolanaAddress(pda.toBase58())).toBe(false)

    expect(() => assertSolanaAddress('')).toThrow(TipFailure)
    expect(() => assertSolanaAddress(pda.toBase58())).toThrow(/valid wallet address/)
  })
})
