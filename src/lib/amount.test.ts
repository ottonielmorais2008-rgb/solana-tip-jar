import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { MAX_TIP_SOL, parseSolToLamports } from './amount.ts'
import { TipFailure } from './errors.ts'

describe('parseSolToLamports', () => {
  it('converts SOL with lamport precision', () => {
    expect(parseSolToLamports('1')).toBe(LAMPORTS_PER_SOL)
    expect(parseSolToLamports(' 0.1 ')).toBe(LAMPORTS_PER_SOL / 10)
    expect(parseSolToLamports('0.000000001')).toBe(1)
    expect(parseSolToLamports('1.5')).toBe(1.5 * LAMPORTS_PER_SOL)
    expect(parseSolToLamports(String(MAX_TIP_SOL))).toBe(MAX_TIP_SOL * LAMPORTS_PER_SOL)
  })

  it('rejects empty, zero, extra decimals, and oversized amounts', () => {
    expect(() => parseSolToLamports('')).toThrow(/Enter a SOL amount/)
    expect(() => parseSolToLamports('0')).toThrow(/greater than 0/)
    expect(() => parseSolToLamports('0.000000000')).toThrow(/greater than 0/)
    expect(() => parseSolToLamports('0.0000000001')).toThrow(TipFailure)
    expect(() => parseSolToLamports('-1')).toThrow(TipFailure)
    expect(() => parseSolToLamports('1e-3')).toThrow(TipFailure)
    expect(() => parseSolToLamports('1,5')).toThrow(TipFailure)
    expect(() => parseSolToLamports(`${MAX_TIP_SOL + 1}`)).toThrow(new RegExp(`${MAX_TIP_SOL}`))
  })
})
