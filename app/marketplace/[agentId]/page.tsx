'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Wallet,
  LogOut,
  Loader2,
  Coins,
  History,
  CheckCircle2,
  Sparkles,
  XCircle,
  Rocket,
  Globe
} from 'lucide-react'
import { useArcWallet } from '@/hooks/useArcWallet'
import { useAgentPayment } from '@/hooks/useAgentPayment'
import { MARKETPLACE_AGENTS } from '@/app/page'
import { AgentExecutionWorkspace } from '@/components/AgentExecutionWorkspace'

export default function AgentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { truncatedAddress, isConnected, isConnecting, connectWallet, disconnectWallet } = useArcWallet()
  const { processAgentPayment, isPaying, paymentStatus, setPaymentStatus } = useAgentPayment()

  const agentId = params?.agentId as string

  // Start with hardcoded agent if found, otherwise null
  const [agent, setAgent] = useState<any>(
    MARKETPLACE_AGENTS.find((a) => a.id === agentId) || null
  )
  const [loadingAgent, setLoadingAgent] = useState(
    !MARKETPLACE_AGENTS.find((a) => a.id === agentId)
  )

  // If not found in hardcoded list, fetch from DB (third-party agent)
  useEffect(() => {
    if (agent) return

    async function fetchThirdPartyAgent() {
      try {
        const res = await fetch('/api/agents/list')
        const data = await res.json()
        if (data.success) {
          const found = data.agents.find((a: any) => a.id === agentId)
          if (found) {
            setAgent({
              ...found,
              icon: Globe,
              color: found.color || 'text-violet-400',
              bg: found.bg || 'from-violet-500/10 to-transparent',
              walletAddress: found.developer_wallet,
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch agent:', err)
      } finally {
        setLoadingAgent(false)
      }
    }

    fetchThirdPartyAgent()
  }, [agentId, agent])

  const handleAgentExecutionPayment = async (
    agentId: string,
    amountString: string,
    targetAgentWallet: string
  ): Promise<boolean> => {
    if (!isConnected) {
      connectWallet()
      return false
    }
    return await processAgentPayment(agentId, amountString, targetAgentWallet)
  }

  // Loading state while fetching third-party agent
  if (loadingAgent) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center">
        <p className="text-slate-500 font-mono text-xs animate-pulse">Loading agent...</p>
      </div>
    )
  }

  // Not found in either source
  if (!agent) {
    return (
      <div className="min-h-screen bg-[#070514] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-rose-400">Agent Configuration Not Found</h1>
          <p className="text-sm text-slate-400">The agent ID `{agentId}` is not registered on this marketplace node.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 inline-flex items-center gap-2 text-sm text-fuchsia-400 hover:text-fuchsia-300 font-mono"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const IconComponent = agent.icon

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 flex flex-col font-sans relative">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-fuchsia-950/30 bg-[#0c0926]/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Image
              src="/fluxarc.jpg"
              alt="FluxArc Logo"
              width={60}
              height={60}
              style={{ width: 'auto', height: 'auto' }}
              className="rounded-lg"
            />
            <div>
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-fuchsia-400 bg-clip-text text-transparent">
                FluxArc
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-widest bg-lime-500/10 text-lime-400 border border-lime-500/20 px-2 py-0.5 rounded-md font-mono font-bold">
                Arc L1 Native
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
            <a href="/support" className="hover:text-fuchsia-400 transition-colors">Help & Guides</a>
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 my-12 space-y-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-fuchsia-400 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
          <span>BACK TO ACTIVE MARKETPLACE</span>
        </Link>

        <div className="bg-[#0e0b2e]/20 border border-fuchsia-990/30 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${agent.bg} opacity-20 pointer-events-none`} />

          <div className="flex gap-4 items-center relative z-10">
            <div className={`${agent.color} bg-slate-900/90 border border-slate-800 p-4 rounded-2xl w-fit shadow-xl`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{agent.name}</h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">{agent.description}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left min-w-[140px] relative z-10">
            <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Base Rate</span>
            <span className="text-xl font-extrabold text-lime-400 font-mono">{agent.price} USDC</span>
            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Per Execution Task</span>
          </div>
        </div>

        <AgentExecutionWorkspace
          agentId={agent.id}
          placeholder={agent.placeholder}
          price={agent.price}
          agentWalletAddress={agent.walletAddress}
          onExecutePayment={handleAgentExecutionPayment}
        />
      </main>

      {/* Cross-chain Bridging Modal */}
      {isPaying && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#0c0926] border border-fuchsia-500/20 rounded-2xl p-6 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-fuchsia-600/10 rounded-full blur-xl pointer-events-none" />

            <div className="space-y-1">
              <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Arc App Kit Bridge Gateway</h3>
              <p className="text-lg font-bold text-white">Authorizing Workspace Funds</p>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
              {paymentStatus === 'detecting' && (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Reading connected provider network layer...</p>
                </div>
              )}
              {paymentStatus === 'approving' && (
                <div className="space-y-3">
                  <Coins className="w-10 h-10 text-lime-400 animate-pulse mx-auto" />
                  <p className="text-xs text-amber-400 font-mono animate-pulse">Awaiting wallet ERC20 token allowance approval...</p>
                </div>
              )}
              {paymentStatus === 'routing' && (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs text-emerald-400 font-mono">CCTP Core Protocol: Routing assets cross-chain to Arc L1...</p>
                </div>
              )}
              {paymentStatus === 'success' && (
                <div className="space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-lime-400 mx-auto" />
                  <p className="text-sm font-bold text-white flex items-center justify-center gap-1">
                    Payment Secured! <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  </p>
                  <p className="text-xs text-slate-400 font-mono">Spinning up agent runtime context threads...</p>
                </div>
              )}
              {paymentStatus === 'error' && (
                <div className="space-y-3">
                  <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-400 font-mono">Transaction rejected or insufficient funds pool.</p>
                  <button
                    onClick={() => setPaymentStatus('idle')}
                    className="mt-2 text-xs text-slate-400 underline hover:text-white cursor-pointer"
                  >
                    Close Modal
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 border border-fuchsia-950/50 rounded-xl px-4 py-3 text-left font-mono text-xs flex justify-between items-center">
              <span className="text-slate-500">Execution Price:</span>
              <span className="text-lime-400 font-bold">{agent.price} USDC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
