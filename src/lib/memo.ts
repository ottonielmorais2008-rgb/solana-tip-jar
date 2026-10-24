import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { tipFailure } from './errors.ts'

export const MAX_MEMO_BYTES = 566
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export function memoByteLength(memo: string): number {
  return new TextEncoder().encode(memo).length
}

export function normalizeMemo(memo: string): string | null {
  const trimmed = memo.trim()
  if (!trimmed) return null
  if (memoByteLength(trimmed) > MAX_MEMO_BYTES) {
    throw tipFailure('memo_too_long')
  }
  return trimmed
}

export function createMemoInstruction(memo: string, signer: PublicKey): TransactionInstruction {
  if (!memo.trim()) {
    throw tipFailure('invalid_amount', 'Memo text is empty.')
  }
  if (memoByteLength(memo) > MAX_MEMO_BYTES) {
    throw tipFailure('memo_too_long')
  }
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(new TextEncoder().encode(memo)),
  })
}
