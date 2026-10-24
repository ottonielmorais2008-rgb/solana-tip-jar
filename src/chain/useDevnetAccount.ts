import { useCallback, useEffect, useState } from 'react'
import { isValidSolanaAddress } from '../lib/address.ts'
import { classifyTipError } from '../lib/errors.ts'
import type { TipRecord } from '../lib/recentTips.ts'
import { useDevnetConnection } from './useDevnetConnection.ts'
import { fetchBalanceLamports, fetchRecentTips, requestDevnetAirdrop } from './rpc.ts'

interface BalanceSnapshot {
  address: string
  lamports: number
  requestId: number
}

interface TipSnapshot {
  address: string
  tips: TipRecord[]
  requestId: number
}

export function useSolBalance(address: string | null) {
  const connection = useDevnetConnection()
  const active = address && isValidSolanaAddress(address) ? address : null
  const [requestId, setRequestId] = useState(0)
  const [snapshot, setSnapshot] = useState<BalanceSnapshot | null>(null)
  const [error, setError] = useState<{ address: string; message: string; requestId: number } | null>(null)
  const [airdropPending, setAirdropPending] = useState(false)
  const [airdropSignature, setAirdropSignature] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const currentRequest = requestId
    void fetchBalanceLamports(connection, active)
      .then((lamports) => {
        if (!cancelled) setSnapshot({ address: active, lamports, requestId: currentRequest })
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError({ address: active, message: classifyTipError(caught).message, requestId: currentRequest })
        }
      })
    return () => {
      cancelled = true
    }
  }, [active, connection, requestId])

  const settled =
    (snapshot?.address === active && snapshot.requestId === requestId) ||
    (error?.address === active && error.requestId === requestId)
  const loading = active !== null && !settled

  const airdrop = useCallback(async () => {
    if (!active) return
    setAirdropPending(true)
    setError(null)
    try {
      const signature = await requestDevnetAirdrop(connection, active)
      setAirdropSignature(signature)
      refresh()
    } catch (caught) {
      setError({ address: active, message: classifyTipError(caught).message, requestId })
    } finally {
      setAirdropPending(false)
    }
  }, [active, connection, refresh, requestId])

  return {
    lamports: snapshot?.address === active && snapshot.requestId === requestId ? snapshot.lamports : null,
    loading,
    error: error?.address === active && error.requestId === requestId ? error.message : null,
    refresh,
    airdrop,
    airdropPending,
    airdropSignature,
  }
}

export function useRecentTips(address: string | null) {
  const connection = useDevnetConnection()
  const active = address && isValidSolanaAddress(address) ? address : null
  const [requestId, setRequestId] = useState(0)
  const [snapshot, setSnapshot] = useState<TipSnapshot | null>(null)
  const [error, setError] = useState<{ address: string; message: string; requestId: number } | null>(null)

  const refresh = useCallback(() => {
    setRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const currentRequest = requestId
    void fetchRecentTips(connection, active)
      .then((tips) => {
        if (!cancelled) setSnapshot({ address: active, tips, requestId: currentRequest })
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError({ address: active, message: classifyTipError(caught).message, requestId: currentRequest })
        }
      })
    return () => {
      cancelled = true
    }
  }, [active, connection, requestId])

  const settled =
    (snapshot?.address === active && snapshot.requestId === requestId) ||
    (error?.address === active && error.requestId === requestId)

  return {
    tips: snapshot?.address === active && snapshot.requestId === requestId ? snapshot.tips : [],
    loading: active !== null && !settled,
    error: error?.address === active && error.requestId === requestId ? error.message : null,
    refresh,
  }
}
