export type PhantomLoginProvider = 'google' | 'apple' | 'injected'

export function selectPhantomProviders(appId: string | undefined): PhantomLoginProvider[] {
  if (appId?.trim()) return ['google', 'apple', 'injected']
  return ['injected']
}

export function phantomRedirectUrl(origin: string, baseUrl: string): string {
  const trimmedOrigin = origin.replace(/\/$/, '')
  if (baseUrl === '/' || baseUrl === '') return `${trimmedOrigin}/`
  const base = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return `${trimmedOrigin}${base.endsWith('/') ? base : `${base}/`}`
}
