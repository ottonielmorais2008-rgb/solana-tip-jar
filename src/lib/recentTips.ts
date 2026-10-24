export interface TipRecord {
  signature: string
  lamports: number
  from: string
  memo: string | null
  blockTime: number | null
}

export function extractIncomingTips(recipient: string, transactions: readonly unknown[]): TipRecord[] {
  const tips: TipRecord[] = []
  for (const transaction of transactions) {
    const tip = readIncomingTip(recipient, transaction)
    if (tip) tips.push(tip)
  }
  tips.sort((left, right) => (right.blockTime ?? -1) - (left.blockTime ?? -1))
  return tips
}

function readIncomingTip(recipient: string, transaction: unknown): TipRecord | null {
  if (!isRecord(transaction)) return null
  if (isRecord(transaction.meta) && transaction.meta.err) return null

  const signature = readSignature(transaction.transaction)
  if (!signature) return null

  const instructions = [
    ...readInstructions(transaction.transaction),
    ...readInnerInstructions(transaction.meta),
  ]

  let lamports = 0
  let from: string | null = null
  let memo: string | null = null
  for (const instruction of instructions) {
    const transfer = readTransfer(instruction)
    if (transfer && transfer.destination === recipient) {
      lamports += transfer.lamports
      from ??= transfer.source
    }
    memo ??= readMemo(instruction)
  }

  if (lamports <= 0 || !from) return null
  return {
    signature,
    lamports,
    from,
    memo,
    blockTime: typeof transaction.blockTime === 'number' ? transaction.blockTime : null,
  }
}

function readSignature(transaction: unknown): string | null {
  if (!isRecord(transaction) || !Array.isArray(transaction.signatures)) return null
  const signature = transaction.signatures[0]
  return typeof signature === 'string' && signature ? signature : null
}

function readInstructions(transaction: unknown): unknown[] {
  if (!isRecord(transaction) || !isRecord(transaction.message)) return []
  return Array.isArray(transaction.message.instructions) ? transaction.message.instructions : []
}

function readInnerInstructions(meta: unknown): unknown[] {
  if (!isRecord(meta) || !Array.isArray(meta.innerInstructions)) return []
  return meta.innerInstructions.flatMap((inner) => {
    if (!isRecord(inner) || !Array.isArray(inner.instructions)) return []
    return inner.instructions
  })
}

function readTransfer(
  instruction: unknown,
): { source: string; destination: string; lamports: number } | null {
  if (!isRecord(instruction) || instruction.program !== 'system' || !isRecord(instruction.parsed)) {
    return null
  }
  if (instruction.parsed.type !== 'transfer' || !isRecord(instruction.parsed.info)) return null
  const { source, destination, lamports } = instruction.parsed.info
  const amount = typeof lamports === 'number' ? lamports : typeof lamports === 'string' ? Number(lamports) : NaN
  if (typeof source !== 'string' || typeof destination !== 'string') return null
  if (!Number.isInteger(amount) || amount <= 0) return null
  return { source, destination, lamports: amount }
}

function readMemo(instruction: unknown): string | null {
  if (!isRecord(instruction) || instruction.program !== 'spl-memo') return null
  if (typeof instruction.parsed === 'string') return instruction.parsed.trim() || null
  if (!isRecord(instruction.parsed)) return null
  if (typeof instruction.parsed.info === 'string') return instruction.parsed.info.trim() || null
  if (isRecord(instruction.parsed.info) && typeof instruction.parsed.info.memo === 'string') {
    return instruction.parsed.info.memo.trim() || null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
