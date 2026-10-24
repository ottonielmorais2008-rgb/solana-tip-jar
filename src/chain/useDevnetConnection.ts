import { useContext } from 'react'
import type { Connection } from '@solana/web3.js'
import { DevnetConnectionContext } from './connectionContext.ts'

export function useDevnetConnection(): Connection {
  const connection = useContext(DevnetConnectionContext)
  if (!connection) {
    throw new Error('useDevnetConnection must be used inside DevnetConnectionProvider')
  }
  return connection
}
