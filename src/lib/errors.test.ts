import { describe, expect, it } from 'vitest'
import { TipFailure, classifyTipError, messageForTipError, tipFailure } from './errors.ts'

describe('classifyTipError', () => {
  it('keeps a TipFailure message and code', () => {
    const error = tipFailure('self_tip')
    expect(classifyTipError(error)).toEqual({
      code: 'self_tip',
      message: messageForTipError('self_tip'),
    })
  })

  it('maps wallet rejection, including numeric code 4001', () => {
    expect(classifyTipError(new Error('User rejected the request.')).code).toBe('user_rejected')
    expect(classifyTipError({ code: 4001, message: 'declined' }).message).toBe(
      messageForTipError('user_rejected'),
    )
    expect(classifyTipError('User canceled the request').code).toBe('user_rejected')
  })

  it('maps insufficient lamports from a simulation error', () => {
    const error = new Error('Transaction simulation failed: insufficient lamports')
    expect(classifyTipError(error)).toEqual({
      code: 'insufficient_balance',
      message: messageForTipError('insufficient_balance'),
    })
  })

  it('maps invalid public keys and missing wallets', () => {
    expect(classifyTipError(new Error('Invalid public key input')).code).toBe('invalid_address')
    expect(classifyTipError(new Error('Non-base58 character')).code).toBe('invalid_address')
    expect(classifyTipError(new Error('Wallet not connected')).code).toBe('wallet_not_connected')
    expect(classifyTipError(new Error('No Solana account')).code).toBe('wallet_not_connected')
  })

  it('maps cluster mismatches and keeps short RPC details', () => {
    expect(classifyTipError(new Error('wrong network')).code).toBe('wrong_network')
    expect(classifyTipError(new Error('429 Too Many Requests: airdrop limit')).message).toContain('429')
    expect(classifyTipError(new Error('failed to fetch')).code).toBe('rpc_failed')
  })

  it('hides very long unknown errors', () => {
    const error = new Error('x'.repeat(200))
    expect(classifyTipError(error)).toEqual({
      code: 'unknown',
      message: messageForTipError('unknown'),
    })
  })

  it('exposes every error code message', () => {
    const codes = [
      'wallet_not_connected',
      'insufficient_balance',
      'user_rejected',
      'invalid_address',
      'invalid_amount',
      'memo_too_long',
      'self_tip',
      'wrong_network',
      'rpc_failed',
      'invalid_profile',
      'unknown',
    ] as const
    for (const code of codes) {
      expect(messageForTipError(code).length).toBeGreaterThan(0)
      expect(new TipFailure(code, 'detail').code).toBe(code)
    }
  })
})
