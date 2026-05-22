'use client'

import { useEffect, useState, useLayoutEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useArcWallet } from '@/hooks/useArcWallet'
import {
  Award,
  Terminal,
  ArrowLeft,
  RefreshCw,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Bot,
  LogOut,
  Wallet,
  History,
  Copy,
  Check,
  Star,
  Rocket
} from 'lucide-react'

interface JobLog {
  job_id: string
  agent_id: string
  status: string
  created_at: string
  tx_hash: string | null
  rating?: number | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { address, truncatedAddress, isConnected, isConnecting, connectWallet, disconnectWallet } = useArcWallet()
  const [isMounted, setIsMounted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [points, setPoints] = useState<number>(0)
  const [historyLogs, setHistoryLogs] = useState<JobLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)

  // Rating states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false)
useEffect(() => {
    setIsMounted(true)  // this is the only mounted effect you need
  }, [])


  useEffect(() => {
    if (!isConnected || !address) return

    async function fetchProfileData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/user/profile?address=${address}`)
        const data = await res.json()
        if (data.success) {
          setPoints(data.points)
          if (data.jobs) {
            setHistoryLogs(data.jobs)
          }
        }
      } catch (err) {
        console.error('Error fetching profile calculations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [isConnected, address])

  const copyWalletToClipboard = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openRatingModal = (jobId: string) => {
    setSelectedJob(jobId)
    setRating(0)
    setIsModalOpen(true)
  }

  const submitRating = async () => {
    if (!selectedJob || rating === 0) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/user/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJob, rating, review_comment: comment })
      })

      if (res.ok) {
        setIsModalOpen(false)
        // Update UI locally
        setHistoryLogs((prev) =>
          prev.map((log) =>
            log.job_id === selectedJob ? { ...log, rating } : log
          )
        )
        // Reset form
        setComment("")
        setRating(0)
      }
    } catch (err) {
      console.error('Error submitting rating:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center">
        <div className="text-slate-500 font-mono text-xs animate-pulse">Initializing profile...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 font-sans flex flex-col relative pb-16">

      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Unified Identical Dashboard Navbar */}
      <header className="sticky top-0 z-50 border-b border-fuchsia-950/30 bg-[#0c0926]/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-8">
          {/* Logo Section */}
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

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 text-sm font-bold text-slate-400">
            <a href="/support" className=" text-fuchsia-400">Help & Guides</a>
          </nav>
          <a href="/launch" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Launch Agent
          </a>
        </div>

        {/* Wallet/Profile Actions */}
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


      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8 my-8 relative z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-fuchsia-400 font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace Marketplace
        </button>

        {/* Profile Card Summary Header */}
        <div className="bg-[#0a0724]/60 border border-fuchsia-500/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-fuchsia-600 to-violet-600 p-3.5 rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                {address ? `${address.toLowerCase().slice(0, 6)}...${address.toLowerCase().slice(-6)}` : 'Anonymous Agent'}
                {address && (
                  <button
                    onClick={copyWalletToClipboard}
                    className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
                    title="Copy Full Wallet Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Arc Layer 1 Ecosystem Profile Account</p>
            </div>
          </div>

          <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl px-5 py-3 flex items-center gap-3 w-full md:w-auto">
            <Award className="w-5 h-5 text-lime-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block tracking-wider">Protocol Incentives Balance</span>
              <span className="text-2xl font-black text-lime-400 font-mono">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin inline-block text-slate-500" /> : `${points} PTS`}
              </span>
            </div>
          </div>
        </div>

        {/* Security / System Diagnostics Box */}
        <div className="bg-[#0e0b2e]/20 border border-fuchsia-950/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-fuchsia-950/40 pb-3">
            <Terminal className="w-4 h-4 text-fuchsia-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Vault & Credentials Logs Status</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Points are securely calculated on-chain via execution relayer logs. Every successfully executed Circle Agent stack workflow logs a tracking ID record to earn native loyalty protocol incentives.
          </p>
        </div>

        {/* Dynamic Personal Execution History Logs Grid */}
        <div className="bg-[#0a0724]/40 border border-fuchsia-500/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-slate-400">
            <span>Your Micro-Relayer Execution Stream</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-fuchsia-500" /> Loading execution databases...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-fuchsia-950/40 rounded-xl text-xs font-mono text-slate-500">
              No historical job instances found associated with this address. Hire an agent to build standard ledger transactions.
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyLogs.map((log) => (
                <div
                  key={log.job_id}
                  className="bg-[#070514]/90 border border-fuchsia-950/50 rounded-xl p-4 flex items-center justify-between text-xs font-mono group hover:border-fuchsia-500/20 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-bold">{log.agent_id.replace('-', ' ').toUpperCase()}</span>
                      <span className="text-[10px] text-slate-600">ID: {log.job_id.slice(0, 8)}...</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Executed: {new Date(log.created_at).toLocaleString()}
                    </div>
                    {/* Rate button — only for successful unrated jobs */}
                    {log.status === 'success' && !log.rating && (
                      <button
                        onClick={() => openRatingModal(log.job_id)}
                        className="text-[10px] text-fuchsia-400 hover:text-white underline block mt-0.5 transition-colors"
                      >
                        Rate Performance
                      </button>
                    )}
                    {/* Show stars if already rated */}
                    {log.rating && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${log.rating! >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${log.status === 'success'
                      ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                      : log.status === 'processing'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                      {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {log.status}
                    </span>

                    {log.tx_hash && (
                      <a
                        href={`https://explorer.testnet.arc.network/tx/${log.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-fuchsia-400 transition"
                        title="View Explorer Receipt"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0c0926] p-6 rounded-2xl border border-fuchsia-500/30 w-80 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Rate Agent Performance</h3>
            <p className="text-xs text-slate-400 font-mono">Select a star rating for this execution.</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-8 h-8 cursor-pointer transition-colors ${rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-yellow-300'}`}
                  onClick={() => setRating(s)}
                />
              ))}
            </div>
            {/* New Review Comment Textarea */}
            <textarea
              placeholder="Leave a review comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-[#070514] border border-fuchsia-900/50 rounded-xl p-3 text-sm text-white focus:border-fuchsia-500 outline-none transition"
              rows={3}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border border-fuchsia-500/30 text-slate-400 hover:text-white py-2 rounded-xl text-sm font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 py-2 rounded-xl font-bold text-sm transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
