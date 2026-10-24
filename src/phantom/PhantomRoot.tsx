import { AddressType } from '@phantom/browser-sdk'
import { PhantomProvider, type PhantomSDKConfig } from '@phantom/react-sdk'
import type { ReactNode } from 'react'
import { phantomRedirectUrl, selectPhantomProviders } from '../lib/phantomSetup.ts'

const theme = {
  background: '#1c3128',
  text: '#f6f0e6',
  secondary: '#8aa398',
  brand: '#e39b2b',
  error: '#8d2f22',
  success: '#1f6b4a',
  borderRadius: '16px',
  overlay: 'rgba(19, 34, 28, 0.72)',
} as const

export function PhantomRoot({ children }: { children: ReactNode }) {
  const appId = import.meta.env.VITE_PHANTOM_APP_ID?.trim() ?? ''
  const config: PhantomSDKConfig = {
    providers: selectPhantomProviders(appId),
    addressTypes: [AddressType.solana],
    ...(appId
      ? {
          appId,
          authOptions: {
            redirectUrl: phantomRedirectUrl(window.location.origin, import.meta.env.BASE_URL),
          },
        }
      : {}),
  }

  return (
    <PhantomProvider config={config} theme={theme} appName="Devnet Tip Jar">
      {children}
    </PhantomProvider>
  )
}
