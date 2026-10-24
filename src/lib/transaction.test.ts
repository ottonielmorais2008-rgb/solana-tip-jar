import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemInstruction, SystemProgram } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { TipFailure } from './errors.ts'
import { MEMO_PROGRAM_ID } from './memo.ts'
import { buildTipTransaction } from './transaction.ts'

const blockhash = 'G4t6s1V1s1V1s1V1s1V1s1V1s1V1s1V1s1V1s1V1'

function pair(): { from: PublicKey; to: PublicKey } {
  return {
    from: Keypair.generate().publicKey,
    to: Keypair.generate().publicKey,
  }
}

describe('buildTipTransaction', () => {
  it('adds a system transfer for the lamport amount', () => {
    const { from, to } = pair()
    const transaction = buildTipTransaction({
      from,
      to,
      lamports: LAMPORTS_PER_SOL / 10,
      memo: null,
      recentBlockhash: blockhash,
    })

    expect(transaction.feePayer?.equals(from)).toBe(true)
    expect(transaction.recentBlockhash).toBe(blockhash)
    expect(transaction.instructions).toHaveLength(1)
    const instruction = transaction.instructions[0]
    if (!instruction) throw new Error('missing transfer')
    expect(SystemInstruction.decodeInstructionType(instruction)).toBe('Transfer')
    const transfer = SystemInstruction.decodeTransfer(instruction)
    expect(transfer.fromPubkey.equals(from)).toBe(true)
    expect(transfer.toPubkey.equals(to)).toBe(true)
    expect(Number(transfer.lamports)).toBe(LAMPORTS_PER_SOL / 10)
    expect(instruction.programId.equals(SystemProgram.programId)).toBe(true)
  })

  it('appends a signed memo and skips blank memos', () => {
    const { from, to } = pair()
    const withMemo = buildTipTransaction({
      from,
      to,
      lamports: 1,
      memo: ' thanks ',
      recentBlockhash: blockhash,
    })
    const memo = withMemo.instructions[1]
    if (!memo) throw new Error('missing memo')
    expect(withMemo.instructions).toHaveLength(2)
    expect(memo.programId.equals(MEMO_PROGRAM_ID)).toBe(true)
    expect(new TextDecoder().decode(memo.data)).toBe(' thanks ')
    expect(memo.keys[0]?.pubkey.equals(from)).toBe(true)
    expect(memo.keys[0]?.isSigner).toBe(true)

    const withoutMemo = buildTipTransaction({
      from,
      to,
      lamports: 1,
      memo: '   ',
      recentBlockhash: blockhash,
    })
    expect(withoutMemo.instructions).toHaveLength(1)
  })

  it('rejects self tips, empty blockhashes, and bad lamport amounts', () => {
    const from = Keypair.generate().publicKey
    expect(() =>
      buildTipTransaction({ from, to: from, lamports: 1, memo: null, recentBlockhash: blockhash }),
    ).toThrow(TipFailure)
    expect(() =>
      buildTipTransaction({
        from,
        to: Keypair.generate().publicKey,
        lamports: 1.5,
        memo: null,
        recentBlockhash: blockhash,
      }),
    ).toThrow(/whole number of lamports/)
    expect(() =>
      buildTipTransaction({
        from,
        to: Keypair.generate().publicKey,
        lamports: 1,
        memo: null,
        recentBlockhash: '  ',
      }),
    ).toThrow(/blockhash/)
  })
})
