import { Keypair } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { TipFailure } from './errors.ts'
import {
  buildTipPath,
  parseTipPath,
  routerBasename,
  toAbsoluteTipUrl,
} from './tipLink.ts'

const address = Keypair.generate().publicKey.toBase58()

describe('tip links', () => {
  it('builds and parses a path with name and note', () => {
    const path = buildTipPath({ address: ` ${address} `, name: 'Ada Lovelace', note: 'for the demo' })
    const queryAt = path.indexOf('?')
    const parsed = parseTipPath(path.slice(0, queryAt), path.slice(queryAt))
    expect(parsed).toEqual({
      address,
      name: 'Ada Lovelace',
      note: 'for the demo',
    })
  })

  it('omits empty profile fields', () => {
    expect(buildTipPath({ address, name: '   ', note: '' })).toBe(`/tip/${address}`)
  })

  it('reads links served from the GitHub Pages base path', () => {
    const parsed = parseTipPath(
      `/solana-tip-jar/tip/${address}/`,
      '?name=Ada&note=Hello%20there',
    )
    expect(parsed).toEqual({ address, name: 'Ada', note: 'Hello there' })
  })

  it('returns null for other routes and broken encodings', () => {
    expect(parseTipPath('/', '')).toBeNull()
    expect(parseTipPath('/tip/', '')).toBeNull()
    expect(parseTipPath('/tip/%E0%A4%A', '')).toBeNull()
  })

  it('limits display text and rejects oversized profile fields', () => {
    const parsed = parseTipPath(`/tip/${address}`, `?name=${'a'.repeat(80)}&note=${'b'.repeat(200)}`)
    expect(parsed?.name).toHaveLength(40)
    expect(parsed?.note).toHaveLength(140)
    expect(() => buildTipPath({ address, name: 'a'.repeat(41) })).toThrow(TipFailure)
    expect(() => buildTipPath({ address: 'not-valid' })).toThrow(TipFailure)
  })

  it('counts emoji as one character when trimming', () => {
    const name = `${'😀'.repeat(40)}x`
    const parsed = parseTipPath(`/tip/${address}`, `?name=${encodeURIComponent(name)}`)
    expect(Array.from(parsed?.name ?? '')).toHaveLength(40)
  })

  it('builds an absolute demo URL and a router basename', () => {
    const path = `/tip/${address}`
    expect(toAbsoluteTipUrl(path, 'https://ottonielmorais2008-rgb.github.io/', '/solana-tip-jar/')).toBe(
      `https://ottonielmorais2008-rgb.github.io/solana-tip-jar/tip/${address}`,
    )
    expect(toAbsoluteTipUrl(path, 'http://localhost:5173', '/')).toBe(`http://localhost:5173/tip/${address}`)
    expect(routerBasename('/solana-tip-jar/')).toBe('/solana-tip-jar')
    expect(routerBasename('/')).toBe('/')
  })
})
