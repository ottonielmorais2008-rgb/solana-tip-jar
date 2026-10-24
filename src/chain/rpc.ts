import { Connection, PublicKey } from '@solana/web3.js'
import { assertSolanaAddress } from '../lib/address.ts'
import { AIRDROP_SOL, parseSolToLamports } from '../lib/amount.ts'
import { resolveDevnetRpcUrl } from '../lib/devnet.ts'
import { extractIncomingTips, type TipRecord } from '../lib/recentTips.ts'

export const RECENT_TIP_LIMIT = 8
const CONFIRM_TIMEOUT_MS = 20_000

export function createDevnetConnection(rpcUrl: string | undefined): Connection {
  return new Connection(resolveDevnetRpcUrl(rpcUrl), 'confirmed')
}

export async function fetchBalanceLamports(connection: Connection, address: string): Promise<number> {
  return connection.getBalance(new PublicKey(assertSolanaAddress(address)), 'confirmed')
}

export async function requestDevnetAirdrop(connection: Connection, address: string): Promise<string> {
  const key = new PublicKey(assertSolanaAddress(address))
  const signature = await connection.requestAirdrop(key, parseSolToLamports(String(AIRDROP_SOL)))
  await confirmDevnetSignature(connection, signature)
  return signature
}

export async function fetchRecentTips(connection: Connection, address: string): Promise<TipRecord[]> {
  const key = new PublicKey(assertSolanaAddress(address))
  const signatures = await connection.getSignaturesForAddress(key, { limit: RECENT_TIP_LIMIT })
  if (signatures.length === 0) return []
  const parsed = await connection.getParsedTransactions(
    signatures.map((item) => item.signature),
    { maxSupportedTransactionVersion: 0 },
  )
  return extractIncomingTips(key.toBase58(), parsed)
}

export async function confirmDevnetSignature(connection: Connection, signature: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Timed out waiting for devnet confirmation.'))
    }, CONFIRM_TIMEOUT_MS)
  })

  try {
    const latest = await Promise.race([connection.getLatestBlockhash('confirmed'), timeout])
    const confirmation = await Promise.race([
      connection.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        'confirmed',
      ),
      timeout,
    ])
    if (confirmation.value.err) {
      throw new Error('The devnet cluster rejected the transaction.')
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
