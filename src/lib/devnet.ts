import { tipFailure } from './errors.ts'

export const DEFAULT_DEVNET_RPC_URL = 'https://api.devnet.solana.com'
export const SOLANA_CLUSTER = 'devnet' as const

const SECRET_QUERY_PARAMS = ['api-key', 'api_key', 'apikey', 'key', 'token', 'access_token']

export function resolveDevnetRpcUrl(override?: string): string {
  const candidate = override?.trim() || DEFAULT_DEVNET_RPC_URL
  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    throw tipFailure('wrong_network', 'The RPC URL is not valid.')
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw tipFailure('wrong_network', 'The RPC URL must use http or https.')
  }
  if (parsed.username || parsed.password || hasSecretQuery(parsed)) {
    throw tipFailure(
      'rpc_failed',
      'RPC URLs cannot include keys or credentials. Use the public devnet endpoint.',
    )
  }

  const haystack = `${parsed.hostname}${parsed.pathname}`.toLowerCase()
  if (haystack.includes('mainnet') || !haystack.includes('devnet')) {
    throw tipFailure('wrong_network', 'This app only accepts a Solana devnet RPC endpoint.')
  }
  return candidate
}

export function devnetExplorerUrl(kind: 'tx' | 'address', value: string): string {
  let path: string
  switch (kind) {
    case 'tx':
      path = 'tx'
      break
    case 'address':
      path = 'address'
      break
    default: {
      const exhaustive: never = kind
      throw new Error(`Unknown explorer kind: ${String(exhaustive)}`)
    }
  }
  return `https://explorer.solana.com/${path}/${encodeURIComponent(value)}?cluster=${SOLANA_CLUSTER}`
}

function hasSecretQuery(url: URL): boolean {
  return SECRET_QUERY_PARAMS.some((param) => url.searchParams.has(param))
}
