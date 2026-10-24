import { Link, Outlet } from 'react-router-dom'
import { DevnetBanner } from './DevnetBanner.tsx'
import { JarMark } from './JarMark.tsx'
import { WalletControls } from './WalletControls.tsx'

export function Layout() {
  return (
    <>
      <DevnetBanner />
      <div className="page">
        <header className="topbar">
          <Link to="/" className="brand">
            <JarMark />
            <span>Devnet Tip Jar</span>
          </Link>
          <WalletControls />
        </header>
        <Outlet />
        <footer className="footer">
          Signed in your browser with Phantom and broadcast to Solana devnet. This app has no backend and never asks
          for a seed phrase.
        </footer>
      </div>
    </>
  )
}
