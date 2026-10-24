import { AddressType } from '@phantom/browser-sdk'
import { useConnect, useDisconnect, useIsExtensionInstalled, usePhantom, useSolana } from '@phantom/react-sdk'
import type { Transaction } from '@solana/web3.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { classifyTipError } from '../lib/errors.ts'
import type { PhantomLoginProvider } from '../lib/phantomSetup.ts'
import { selectPhantomProviders } from '../lib/phantomSetup.ts'

export function useDevnetWallet() {
  const { isConnected, isLoading, addresses } = usePhantom()
  const { connect, isConnecting, error: connectError } = useConnect()
  const { disconnect, isDisconnecting } = useDisconnect()
  const { solana } = useSolana()
  const extension = useIsExtensionInstalled()
  const [actionError, setActionError] = useState<string | null>(null)
  const switchedFor = useRef<string | null>(null)

  const address = (addresses ?? []).find((account) => account.addressType === AddressType.solana)?.address ?? null
  const embeddedLogin = selectPhantomProviders(import.meta.env.VITE_PHANTOM_APP_ID).includes('google')

  useEffect(() => {
    if (!isConnected || !address || switchedFor.current === address) return
    switchedFor.current = address
    void solana.switchNetwork('devnet').catch((error: unknown) => {
      setActionError(classifyTipError(error).message)
    })
  }, [address, isConnected, solana])

  const connectWith = useCallback(
    async (provider: PhantomLoginProvider) => {
      setActionError(null)
      try {
        await connect({ provider })
      } catch (error) {
        setActionError(classifyTipError(error).message)
      }
    },
    [connect],
  )

  const signAndSend = useCallback(
    async (transaction: Transaction) => {
      // Embedded wallets only support signing and sending in one step.
      await solana.switchNetwork('devnet')
      return solana.signAndSendTransaction(transaction)
    },
    [solana],
  )

  const disconnectWallet = useCallback(() => {
    setActionError(null)
    void disconnect().catch((error: unknown) => {
      setActionError(classifyTipError(error).message)
    })
  }, [disconnect])

  return {
    address,
    isConnected,
    isLoading: isLoading || extension.isLoading,
    isConnecting,
    isDisconnecting,
    isExtensionInstalled: extension.isInstalled,
    embeddedLogin,
    actionError: actionError ?? (connectError ? classifyTipError(connectError).message : null),
    connectWith,
    disconnect: disconnectWallet,
    signAndSend,
  }
}
