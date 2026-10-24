import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { FEE_BUFFER_LAMPORTS } from './amount.ts'
import { prepareTip } from './tipRequest.ts'

const payer = Keypair.generate().publicKey.toBase58()
const recipient = Keypair.generate().publicKey.toBase58()

describe('prepareTip', () => {
  it('prepares a payable tip with a trimmed memo', () => {
    const prepared = prepareTip({
      payer,
      recipient,
      amountSol: '0.25',
      balanceLamports: LAMPORTS_PER_SOL,
      memo: '  hello  ',
    })
    expect(prepared).toEqual({
      payer,
      recipient,
      lamports: LAMPORTS_PER_SOL / 4,
      memo: 'hello',
    })
  })

  it('requires a connected wallet, a valid recipient, and enough lamports for the fee', () => {
    expect(() =>
      prepareTip({
        payer: null,
        recipient,
        amountSol: '0.1',
        balanceLamports: LAMPORTS_PER_SOL,
        memo: '',
      }),
    ).toThrow(/Connect a Phantom wallet/)

    expect(() =>
      prepareTip({
        payer,
        recipient: 'not-valid',
        amountSol: '0.1',
        balanceLamports: LAMPORTS_PER_SOL,
        memo: '',
      }),
    ).toThrow(/tip link address/)

    expect(() =>
      prepareTip({
        payer: 'not-valid',
        recipient,
        amountSol: '0.1',
        balanceLamports: LAMPORTS_PER_SOL,
        memo: '',
      }),
    ).toThrow(/connected wallet address/)

    const lamports = LAMPORTS_PER_SOL / 10
    expect(() =>
      prepareTip({
        payer,
        recipient,
        amountSol: '0.1',
        balanceLamports: lamports + FEE_BUFFER_LAMPORTS - 1,
        memo: '',
      }),
    ).toThrow(/not have enough devnet SOL/)

    expect(
      prepareTip({
        payer,
        recipient,
        amountSol: '0.1',
        balanceLamports: lamports + FEE_BUFFER_LAMPORTS,
        memo: '   ',
      }).memo,
    ).toBeNull()
  })

  it('rejects a self tip and a missing balance', () => {
    expect(() =>
      prepareTip({
        payer,
        recipient: payer,
        amountSol: '0.1',
        balanceLamports: LAMPORTS_PER_SOL,
        memo: '',
      }),
    ).toThrow(/cannot tip itself/)

    expect(() =>
      prepareTip({
        payer,
        recipient,
        amountSol: '0.1',
        balanceLamports: null,
        memo: '',
      }),
    ).toThrow(/balance is not available/)
  })
})
