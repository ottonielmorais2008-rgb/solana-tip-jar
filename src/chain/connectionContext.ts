import { createContext } from 'react'
import type { Connection } from '@solana/web3.js'

export const DevnetConnectionContext = createContext<Connection | null>(null)
