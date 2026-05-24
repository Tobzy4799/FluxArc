'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, History, Rocket, Menu, X, Wallet } from 'lucide-react'
import { useArcWallet } from '@/hooks/useArcWallet'

export default function NavBar() {
  const router = useRouter()
  const { truncatedAddress, isConnected, isConnecting, connectWallet, disconnectWallet } = useArcWallet()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-fuchsia-950/30 bg-[#0c0926]/60 backdrop-blur-xl px-4 md:px-6 py-4 relative">
      <div className="flex justify-between items-center">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
          <Image
            src="/fluxarc.jpg"
            alt="FluxArc Logo"
            width={40}
            height={40}
            style={{ width: 'auto', height: 'auto' }}
            className="rounded-lg"
          />
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-fuchsia-400 bg-clip-text text-transparent">
            FluxArc
          </span>
          <span className="hidden sm:inline text-[9px] uppercase tracking-widest bg-lime-500/10 text-lime-400 border border-lime-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold">
            Arc L1
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
          <a href="/support" className="hover:text-fuchsia-400 transition-colors">Help & Guides</a>
          <a href="/launch" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Launch Agent
          </a>
        </nav>

        {/* Desktop wallet */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected && (
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-xs font-semibold bg-[#120d3d]/40 hover:bg-[#120d3d]/80 border border-fuchsia-500/20 text-fuchsia-200 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-fuchsia-400" /> Profile
            </button>
          )}
          {isConnected ? (
            <div className="flex items-center gap-2 bg-[#120d3d] border border-fuchsia-500/30 rounded-xl px-4 py-2 text-sm font-mono text-fuchsia-300">
              <span className="w-2 h-2 bg-lime-400 rounded-full animate-ping" />
              <span>{truncatedAddress}</span>
              <button onClick={() => disconnectWallet()} className="ml-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-xl disabled:opacity-50 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {/* Mobile: wallet status + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isConnected && (
            <div className="flex items-center gap-1.5 bg-[#120d3d] border border-fuchsia-500/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-fuchsia-300">
              <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-ping" />
              <span>{truncatedAddress}</span>
            </div>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-fuchsia-950/40 space-y-2 pt-3">
          <a
            href="/support"
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-fuchsia-400 px-2 py-2 rounded-lg hover:bg-fuchsia-950/20 transition"
            onClick={() => setMenuOpen(false)}
          >
            Help & Guides
          </a>
          <a
            href="/launch"
            className="flex items-center gap-2 text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300 px-2 py-2 rounded-lg hover:bg-fuchsia-950/20 transition"
            onClick={() => setMenuOpen(false)}
          >
            <Rocket className="w-3.5 h-3.5" /> Launch Agent
          </a>

          {isConnected ? (
            <>
              <button
                onClick={() => { router.push('/profile'); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full text-sm font-semibold text-fuchsia-200 px-2 py-2 rounded-lg hover:bg-fuchsia-950/20 transition text-left"
              >
                <History className="w-3.5 h-3.5 text-fuchsia-400" /> Profile
              </button>
              <button
                onClick={() => { disconnectWallet(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full text-sm font-semibold text-rose-400 hover:text-rose-300 px-2 py-2 rounded-lg hover:bg-rose-950/20 transition text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              onClick={() => { connectWallet(); setMenuOpen(false) }}
              disabled={isConnecting}
              className="flex items-center gap-2 w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      )}
    </header>
  )
}
