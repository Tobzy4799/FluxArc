'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Wallet,
  Bot,
  Coins,
  ShieldCheck,
  Terminal,
  Layers,
  LogOut,
  Cpu,
  Code,
  Globe,
  PenTool,
  Languages,
  Video,
  ChevronRight,
  History,
  Activity,
  BarChart3,
  Rocket
} from 'lucide-react'
import { useArcWallet } from '@/hooks/useArcWallet'

export const MARKETPLACE_AGENTS = [
  {
    id: 'social-manager',
    name: 'SocialPulse Marketer',
    description: 'Generates viral social media content schedules and marketing copy tailored to your product or business.',
    placeholder: 'e.g., I launch handmade leather wallets next week. Generate a 3-day Twitter launch plan with high-converting hook patterns.',
    price: '0.10',
    icon: PenTool,
    color: 'text-pink-400',
    bg: 'from-pink-500/10 to-transparent',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  },
  {
    id: 'youtube-optimizer',
    name: 'YT Viral Catalyst',
    description: 'Transforms simple video concepts into high-retention YouTube scripts, SEO titles, and descriptions.',
    placeholder: 'e.g., Topic: Explaining Blockchain Layer 1 networks using a post-office analogy for absolute beginners.',
    price: '0.25',
    icon: Video,
    color: 'text-rose-400',
    bg: 'from-rose-500/10 to-transparent',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  },
  {
    id: 'global-localizer',
    name: 'LinguaBridge AI',
    description: 'Translates and culturally localizes business copy or articles into 15+ languages natively.',
    placeholder: 'e.g., Translate our mobile landing page copy into Japanese and Spanish. Keep the tone casual and exciting.',
    price: '0.15',
    icon: Languages,
    color: 'text-indigo-400',
    bg: 'from-indigo-500/10 to-transparent',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  },
  {
    id: 'solidity-auditor',
    name: 'Solidity Guard AI',
    description: 'Scans web3 smart contracts for critical security vulnerabilities, reentrancy bugs, and gas optimizations.',
    placeholder: 'paste your Solidity code here contract MyToken { ... }',
    price: '0.50',
    icon: Code,
    color: 'text-fuchsia-400',
    bg: 'from-fuchsia-500/10 to-transparent',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  },
  {
    id: 'web-scraper',
    name: 'ScrapeMaster Pro',
    description: 'Extracts real-time competitor pricing or public social sentiment data across the web into neat lists.',
    placeholder: 'e.g., Extract product titles and USD prices from the top 5 trending mechanical keyboards on Amazon.',
    price: '0.20',
    icon: Globe,
    color: 'text-lime-400',
    bg: 'from-lime-500/10 to-transparent',
    walletAddress: '0x9965507D1a0565297e11999c20C89f666717f1e3'
  }
]

const MOCK_ACTIVITIES = [
  "Wallet 0x61b... just hired Solidity Guard AI (0.50 USDC)",
  "Wallet 0xf39... executed SocialPulse Marketer task safely (0.10 USDC)",
  "Wallet 0x90f... earned native protocol points via LinguaBridge AI",
  "Wallet 0x3c4... just hired YT Viral Catalyst (0.25 USDC)"
]

export default function Home() {
  const router = useRouter()
  const { address, truncatedAddress, isConnected, isConnecting, connectWallet, disconnectWallet } = useArcWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0)
  const [liveActivities, setLiveActivities] = useState<string[]>([])
  const [stats, setStats] = useState({ tasksExecuted: 0, activeWallets: 0, totalVolume: 0 })
  const [agentBalances, setAgentBalances] = useState<Record<string, string>>({})
  const [agentStats, setAgentStats] = useState<Record<string, { tasks24h: number, avgRating: number }>>({})

  // Third-party agents fetched from DB — merged with your hardcoded ones below
  const [thirdPartyAgents, setThirdPartyAgents] = useState<any[]>([])

  const currentFeedSource = liveActivities.length > 0 ? liveActivities : MOCK_ACTIVITIES

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % currentFeedSource.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [currentFeedSource])

  useEffect(() => {
    async function fetchEcosystemData() {
      try {
        const queryAddress = address || "0x0000000000000000000000000000000000000000"
        const profileRes = await fetch(`/api/user/profile?address=${queryAddress}`)
        const profileData = await profileRes.json()

        if (profileData.success) {
          if (profileData.liveActivities) setLiveActivities(profileData.liveActivities)
          setStats({
            tasksExecuted: profileData.tasksExecuted || 0,
            activeWallets: profileData.activeWallets || 0,
            totalVolume: profileData.totalVolume || 0
          })
        }

        const statsRes = await fetch('/api/agents/stats')
        const statsData = await statsRes.json()
        if (statsData.success) {
          setAgentStats(statsData.stats)
          setAgentBalances(statsData.balances)
        }

        // Fetch approved third-party agents from DB and merge into marketplace
        const agentListRes = await fetch('/api/agents/list')
        const agentListData = await agentListRes.json()
        if (agentListData.success) {
          setThirdPartyAgents(agentListData.agents)
        }
      } catch (err) {
        console.error("Failed to sync ecosystem data:", err)
      }
    }

    fetchEcosystemData()
  }, [address])

  // Merge your hardcoded agents with approved third-party ones
  // Third-party agents use Globe as default icon since we can't store React components in DB
  const allAgents = [
    ...MARKETPLACE_AGENTS,
    ...thirdPartyAgents.map((a: any) => ({
      ...a,
      icon: Globe,
      color: a.color || 'text-violet-400',
      bg: a.bg || 'from-violet-500/10 to-transparent',
      walletAddress: a.developer_wallet,
    }))
  ]

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 flex flex-col font-sans relative pb-16">

      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-fuchsia-950/30 bg-[#0c0926]/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image
                src="/fluxarc.jpg"
                alt="FluxArc Logo"
                width={60}
                height={60}
                style={{ width: 'auto', height: 'auto' }}
                className="rounded-lg"
              />
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-fuchsia-400 bg-clip-text text-transparent">
                FluxArc
              </span>
            </Link>

            {/* This badge is outside the Link, so it remains non-clickable */}
            <span className="ml-2 text-[10px] uppercase tracking-widest bg-lime-500/10 text-lime-400 border border-lime-500/20 px-2 py-0.5 rounded-md font-mono font-bold">
              Arc L1 Native
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
            <a href="/support" className="hover:text-fuchsia-400 transition-colors">Help & Guides</a>
            {/* Launch Agent link — visible to everyone, encourages devs to list */}
            <a href="/launch" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Launch Agent
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-xs font-semibold bg-[#120d3d]/40 hover:bg-[#120d3d]/80 border border-fuchsia-500/20 text-fuchsia-200 px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-fuchsia-400" />
              Profile
            </button>
          )}

          {isConnected ? (
            <div className="flex items-center gap-2 bg-[#120d3d] border border-fuchsia-500/30 rounded-xl px-4 py-2 text-sm font-mono text-fuchsia-300 shadow-lg">
              <span className="w-2 h-2 bg-lime-400 rounded-full animate-ping" />
              <span>{truncatedAddress}</span>
              <button
                onClick={() => disconnectWallet()}
                className="ml-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm shadow-xl shadow-fuchsia-600/20 hover:shadow-fuchsia-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-12 my-12 relative z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 rounded-full text-xs text-fuchsia-300 font-medium">
            <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse" />
            Powered by Circle Agent Stack & Nanopayments
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Execute AI-driven tasks instantly with{' '}
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
              USDC
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Scale your operations with autonomous micro-agents. From web data extraction to real-time security, enjoy sub-second finality and pay-per-task simplicity—no subscriptions, no bloat.
          </p>
          <div className="text-sm font-mono bg-fuchsia-400 px-4 py-2 rounded-lg border border-fuchsia-500/10">
            Got no USDC on Arc? Bridge your USDC to Arc to begin payments in seconds
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto bg-[#0a0724]/60 border border-fuchsia-500/10 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-2xl">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Total Vol Processed</span>
            <span className="text-xl md:text-2xl font-black text-lime-400 font-mono">
              {stats.totalVolume.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">USDC</span>
            </span>
          </div>
          <div className="text-center space-y-1 border-l border-fuchsia-950/40">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Tasks Executed</span>
            <span className="text-xl md:text-2xl font-black text-white font-mono">{stats.tasksExecuted.toLocaleString()}</span>
          </div>
          <div className="text-center space-y-1 border-l border-fuchsia-950/40">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Active Wallets</span>
            <span className="text-xl md:text-2xl font-black text-fuchsia-400 font-mono">{stats.activeWallets.toLocaleString()}</span>
          </div>
          <div className="text-center space-y-1 border-l border-fuchsia-950/40">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Avg Settlement Speed</span>
            <span className="text-xl md:text-2xl font-black text-sky-400 font-mono">0.64s</span>
          </div>
        </div>

        {/* Agent Marketplace — now shows both your agents AND approved third-party ones */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-fuchsia-950/40 pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-2xl font-bold tracking-tight">Active AI Worker Marketplace</h2>
              {thirdPartyAgents.length > 0 && (
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  +{thirdPartyAgents.length} Community
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono hidden sm:flex">
              <BarChart3 className="w-3.5 h-3.5 text-lime-400" />
              <span>Execution Engine Status: Live</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAgents.map((agent) => {
              const IconComponent = agent.icon;
              const isThirdParty = !MARKETPLACE_AGENTS.find(a => a.id === agent.id)

              const liveVaultRevenue =
                agentBalances[agent.id] ||
                agentBalances[agent.id.toLowerCase()] ||
                agentBalances[agent.walletAddress?.toLowerCase()] ||
                '0.00';

              const agentStat = agentStats[agent.id] || { tasks24h: 0, avgRating: 0 };

              return (
                <Link
                  href={`/marketplace/${agent.id}`}
                  key={agent.id}
                  className="bg-[#0e0b2e]/30 border border-fuchsia-900/20 rounded-2xl p-6 flex flex-col justify-between hover:border-fuchsia-500/40 transition-all group relative overflow-hidden cursor-pointer shadow-lg hover:shadow-fuchsia-950/10"
                >
                  <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${agent.bg} opacity-40 pointer-events-none`} />

                  <div className="relative z-10 space-y-4">
                    <div className="flex gap-2 -mb-2">
                      {/* Community badge for third-party agents */}
                      {isThirdParty && (
                        <span className="flex items-center gap-1 text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20 font-bold uppercase tracking-wider">
                          Community
                        </span>
                      )}
                      {agentStat.tasks24h > 5 && (
                        <span className="flex items-center gap-1 text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wider">
                          High Demand
                        </span>
                      )}
                      {agentStat.avgRating > 0 && (
                        <span className="flex items-center gap-1 text-[9px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-bold uppercase tracking-wider">
                          ★ {agentStat.avgRating.toFixed(1)} Rating
                        </span>
                      )}
                    </div>

                    <div className={`${agent.color} bg-slate-900/80 border border-slate-800 p-3 rounded-xl w-fit shadow-md`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-white transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed min-h-[48px]">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-fuchsia-950/30 flex justify-between items-center relative z-10">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">
                        Cost per run
                      </span>
                      <span className="text-sm font-bold text-lime-400 font-mono">
                        {agent.price} USDC
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 group-hover:bg-fuchsia-600 group-hover:text-white transition-all flex items-center gap-1">
                      Hire Agent <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          <a
            href="https://docs.arc.io/app-kit/bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0e0b2e]/10 border border-fuchsia-950/40 rounded-2xl p-6 relative overflow-hidden hover:border-lime-500/50 transition-colors"
          >
            <div className="bg-lime-500/10 text-lime-400 p-2.5 rounded-xl w-fit mb-4 border border-lime-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Arc App Kit Integration</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Bridge USDC from any blockchain seamlessly. Arc App Kit handles cross-chain unified balance routing and bridging instantly in the background.
            </p>
          </a>

          <a
            href="https://developers.circle.com/wallets/account-types"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0e0b2e]/10 border border-fuchsia-950/40 rounded-2xl p-6 relative overflow-hidden hover:border-fuchsia-500/50 transition-colors"
          >
            <div className="bg-fuchsia-500/10 text-fuchsia-400 p-2.5 rounded-xl w-fit mb-4 border border-fuchsia-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Circle Agent Stack & Wallets</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every single AI worker operates with an isolated, secure Developer-Controlled Wallet on Arc L1 to receive earnings and pay for downstream micro-services.
            </p>
          </a>
</div>
          <div className="border-t border-fuchsia-950/40 pt-8 flex flex-wrap justify-center items-center gap-8 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-fuchsia-500/70" />
              <span>x402 Protocol Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-500/70" />
              <span>Secure Dev-Controlled Escrow</span>
            </div>
          </div>
      </main>

      {/* Activity Ticker */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#0a0720]/95 backdrop-blur-md border-t border-fuchsia-500/20 py-2.5 px-6 z-50 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 text-fuchsia-400 font-mono font-bold text-xs shrink-0 select-none border-r border-fuchsia-900/40 pr-4">
          <Activity className="w-4 h-4 animate-pulse text-lime-400" />
          <span>LIVE TRACKER:</span>
        </div>
        <div className="w-full pl-4 overflow-hidden relative">
          <div
            key={currentTickerIndex}
            className="text-xs font-mono text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-500 truncate"
          >
            ⚡ {currentFeedSource[currentTickerIndex]}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-slate-500 shrink-0 select-none pl-4 border-l border-fuchsia-900/40">
          <span>NETWORK STATUS: ONLINE</span>
          <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-ping" />
        </div>
      </footer>

    </div>
  )
}
