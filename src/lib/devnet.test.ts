import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { DEFAULT_DEVNET_RPC_URL, devnetExplorerUrl, resolveDevnetRpcUrl } from './devnet.ts'
import { formatBlockTime, formatLamportsAsSol, shortenAddress } from './format.ts'
import { MAX_MEMO_BYTES, memoByteLength, normalizeMemo } from './memo.ts'
import { phantomRedirectUrl, selectPhantomProviders } from './phantomSetup.ts'

describe('devnet configuration', () => {
  it('defaults to the public devnet RPC and rejects other clusters and credentials', () => {
    expect(resolveDevnetRpcUrl(undefined)).toBe(DEFAULT_DEVNET_RPC_URL)
    expect(resolveDevnetRpcUrl('  ')).toBe(DEFAULT_DEVNET_RPC_URL)
    expect(resolveDevnetRpcUrl('https://api.devnet.solana.com')).toBe('https://api.devnet.solana.com')
    expect(() => resolveDevnetRpcUrl('https://api.mainnet-beta.solana.com')).toThrow(/devnet/)
    expect(() => resolveDevnetRpcUrl('https://example.com')).toThrow(/devnet/)
    expect(() => resolveDevnetRpcUrl('https://devnet.example.com/?api-key=secret')).toThrow(/credentials/)
    expect(() => resolveDevnetRpcUrl('https://user:pass@devnet.example.com')).toThrow(/credentials/)
    expect(() => resolveDevnetRpcUrl('ftp://devnet.example.com')).toThrow(/http/)
    expect(() => resolveDevnetRpcUrl('not a url')).toThrow(/not valid/)
  })

  it('always links to the devnet explorer', () => {
    expect(devnetExplorerUrl('tx', 'sig+1')).toBe('https://explorer.solana.com/tx/sig%2B1?cluster=devnet')
    expect(devnetExplorerUrl('address', 'addr')).toBe('https://explorer.solana.com/address/addr?cluster=devnet')
    expect(devnetExplorerUrl('tx', 'sig')).not.toContain('mainnet')
  })

  it('does not ship a mainnet send path or a hardcoded lamport scale', () => {
    const source = readSources(path.resolve('src')).join('\n')
    expect(source).not.toMatch(/mainnet-beta/)
    expect(source).not.toMatch(/api\.mainnet/)
    expect(source).not.toMatch(/cluster=mainnet/)
    expect(source).not.toMatch(/switchNetwork\(\s*['"]mainnet['"]\s*\)/)
    expect(source).not.toMatch(/1_000_000_000|1000000000/)
  })
})

describe('formatting and phantom setup', () => {
  it('formats lamports, short addresses, and timestamps', () => {
    expect(formatLamportsAsSol(0)).toBe('0')
    expect(formatLamportsAsSol(LAMPORTS_PER_SOL)).toBe('1')
    expect(formatLamportsAsSol(LAMPORTS_PER_SOL + 1)).toBe('1.000000001')
    expect(shortenAddress('ABCDEFGHIJKLMNOP', 4)).toBe('ABCD…MNOP')
    expect(shortenAddress('abc', 4)).toBe('abc')
    expect(formatBlockTime(null)).toBe('Time unknown')
    expect(formatBlockTime(0)).toContain('1970')
  })

  it('normalizes memos and chooses phantom providers from the public app id', () => {
    expect(normalizeMemo('   ')).toBeNull()
    expect(normalizeMemo(' thanks ')).toBe('thanks')
    expect(memoByteLength('é')).toBe(2)
    expect(() => normalizeMemo('a'.repeat(MAX_MEMO_BYTES + 1))).toThrow(/too long/)
    expect(selectPhantomProviders(undefined)).toEqual(['injected'])
    expect(selectPhantomProviders('  ')).toEqual(['injected'])
    expect(selectPhantomProviders(' public-app-id ')).toEqual(['google', 'apple', 'injected'])
    expect(phantomRedirectUrl('http://localhost:5173/', '/')).toBe('http://localhost:5173/')
    expect(phantomRedirectUrl('https://ottonielmorais2008-rgb.github.io', '/solana-tip-jar/')).toBe(
      'https://ottonielmorais2008-rgb.github.io/solana-tip-jar/',
    )
  })
})

function readSources(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...readSources(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      files.push(readFileSync(full, 'utf8'))
    }
  }
  return files
}
