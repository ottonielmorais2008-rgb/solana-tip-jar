import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { tipFailure } from './errors.ts'
import { createMemoInstruction } from './memo.ts'

export function buildTipTransaction(input: {
  from: PublicKey
  to: PublicKey
  lamports: number
  memo: string | null
  recentBlockhash: string
}): Transaction {
  if (!Number.isInteger(input.lamports) || input.lamports <= 0) {
    throw tipFailure('invalid_amount', 'Tip amount must be a positive whole number of lamports.')
  }
  if (input.from.equals(input.to)) {
    throw tipFailure('self_tip')
  }
  if (!input.recentBlockhash.trim()) {
    throw tipFailure('rpc_failed', 'A devnet blockhash is required before sending.')
  }

  const transaction = new Transaction()
  transaction.feePayer = input.from
  transaction.recentBlockhash = input.recentBlockhash
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: input.from,
      toPubkey: input.to,
      lamports: input.lamports,
    }),
  )

  if (input.memo?.trim()) {
    transaction.add(createMemoInstruction(input.memo, input.from))
  }
  return transaction
}
