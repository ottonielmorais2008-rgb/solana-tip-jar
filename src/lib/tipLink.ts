import { assertSolanaAddress } from './address.ts'
import { tipFailure } from './errors.ts'

export const MAX_DISPLAY_NAME_LENGTH = 40
export const MAX_PAGE_NOTE_LENGTH = 140
export const TIP_ROUTE_BASENAME = '/solana-tip-jar'

export interface TipLinkParts {
  address: string
  name: string
  note: string
}

export function buildTipPath(input: { address: string; name?: string; note?: string }): string {
  const address = assertSolanaAddress(input.address)
  const name = cleanProfile(input.name, MAX_DISPLAY_NAME_LENGTH, 'Display name')
  const note = cleanProfile(input.note, MAX_PAGE_NOTE_LENGTH, 'Note')
  const params = new URLSearchParams()
  if (name) params.set('name', name)
  if (note) params.set('note', note)
  const query = params.toString()
  return query ? `/tip/${address}?${query}` : `/tip/${address}`
}

export function parseTipPath(
  pathname: string,
  search = '',
  basename = TIP_ROUTE_BASENAME,
): TipLinkParts | null {
  const stripped = stripAppBasename(pathname, basename).replace(/\/+$/, '') || '/'
  const match = /^\/tip\/([^/]+)$/.exec(stripped)
  const encoded = match?.[1]
  if (!encoded) return null

  let address: string
  try {
    address = decodeURIComponent(encoded)
  } catch {
    return null
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return {
    address,
    name: limitText(params.get('name') ?? '', MAX_DISPLAY_NAME_LENGTH),
    note: limitText(params.get('note') ?? '', MAX_PAGE_NOTE_LENGTH),
  }
}

export function stripAppBasename(pathname: string, basename: string): string {
  const base = routerBasename(basename)
  if (base !== '/' && (pathname === base || pathname.startsWith(`${base}/`))) {
    const rest = pathname.slice(base.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname || '/'
}

export function routerBasename(baseUrl: string): string {
  if (baseUrl === '/' || baseUrl === '') return '/'
  const withSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}

export function toAbsoluteTipUrl(path: string, origin: string, baseUrl: string): string {
  const prefix = routerBasename(baseUrl)
  const normalizedOrigin = origin.replace(/\/$/, '')
  const base = prefix === '/' ? '' : prefix
  return `${normalizedOrigin}${base}${path}`
}

function cleanProfile(value: string | undefined, max: number, label: string): string {
  const trimmed = value?.trim() ?? ''
  if (Array.from(trimmed).length > max) {
    throw tipFailure('invalid_profile', `${label} must be ${max} characters or fewer.`)
  }
  return trimmed
}

function limitText(value: string, max: number): string {
  return Array.from(value).slice(0, max).join('')
}
