import { useState, type ReactNode } from 'react'
import { classifyTipError } from '../lib/errors.ts'
import { DevnetBanner } from '../components/DevnetBanner.tsx'
import { DevnetConnectionContext } from './connectionContext.ts'
import { createDevnetConnection } from './rpc.ts'

export function DevnetConnectionProvider({ children }: { children: ReactNode }) {
  const [setup] = useState(() => {
    try {
      return {
        connection: createDevnetConnection(import.meta.env.VITE_SOLANA_RPC_URL),
        message: null,
      }
    } catch (error) {
      return { connection: null, message: classifyTipError(error).message }
    }
  })

  if (!setup.connection) {
    return (
      <>
        <DevnetBanner />
        <main className="shell">
          <p className="alert" role="alert">
            {setup.message}
          </p>
        </main>
      </>
    )
  }

  return <DevnetConnectionContext.Provider value={setup.connection}>{children}</DevnetConnectionContext.Provider>
}
