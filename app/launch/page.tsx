'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSendTransaction} from 'wagmi'
import { parseUnits } from 'viem'


import { useArcWallet } from '@/hooks/useArcWallet'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    Bot, ArrowLeft, LogOut, History,
    Rocket
} from 'lucide-react'


const LISTING_FEE_USDC = '5'
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET as `0x${string}`

export default function LaunchPage() {
    const router = useRouter()
    const { truncatedAddress, isConnecting, connectWallet, disconnectWallet } = useArcWallet()

    const { address, isConnected } = useAccount()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true)
        }, 0)
        return () => clearTimeout(timer)
    }, [])
    const [step, setStep] = useState<'form' | 'paying' | 'submitting' | 'done'>('form')
    const [txHash, setTxHash] = useState('')
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '', description: '', placeholder: '',
        price: '', prompt: '', developer_email: ''
    })

   const { sendTransaction, isPending } = useSendTransaction({
  mutation: {
    onSuccess: (hash) => {
      setStep('submitting')
      submitToDatabase(hash)
    },
    onError: (err: any) => {
      setError(err.message)
      setStep('form')
    }
  }
})

    const handlePayAndSubmit = () => {
  if (!isConnected || !address) return
  if (!form.name || !form.description || !form.placeholder || !form.price || !form.prompt) {
    setError('Please fill in all required fields before paying.')
    return
  }
  setStep('paying')
  sendTransaction({
    to: process.env.NEXT_PUBLIC_PLATFORM_WALLET as `0x${string}`,
    value: parseUnits('5', 18), // 5 USDC as native token on Arc (18 decimals)
  })
}

    const submitToDatabase = async (hash: string) => {
        const res = await fetch('/api/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                developer_wallet: address,
                tx_hash: hash
            })
        })
        const data = await res.json()
        if (data.success) {
            setStep('done')
        } else {
            setError(data.error || 'Submission failed')
            setStep('form')
        }
    }

    return (
        <div className="min-h-screen bg-[#070514] text-slate-100 p-6">
            <header className="sticky top-0 z-50 border-b border-fuchsia-950/30 bg-[#0c0926]/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center relative">
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
                        <span className="font-black text-2xl tracking-tight text-white">FluxArc</span>
                    </div>
                    <nav className="flex items-center gap-6 text-sm font-bold text-slate-400">

                        <a href="/support" className="text-fuchsia-400">Help & Guides</a>
                    </nav>
                    <a href="/launch" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1.5">
                        <Rocket className="w-3.5 h-3.5" /> Launch Agent
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {/* Only render this content after the component has mounted on the client */}
                    {mounted ? (
                        <>
                            {isConnected && (
                                <button onClick={() => router.push('/profile')} className="flex items-center gap-2 text-xs font-semibold bg-[#120d3d]/40 border border-fuchsia-500/20 text-fuchsia-200 px-4 py-2 rounded-xl">
                                    <History className="w-3.5 h-3.5" /> Profile
                                </button>
                            )}
                            {isConnected ? (
                                <div className="flex items-center gap-2 bg-[#120d3d] border border-fuchsia-500/30 rounded-xl px-4 py-2 text-sm font-mono text-fuchsia-300">
                                    <span>{truncatedAddress}</span>
                                    <button onClick={() => disconnectWallet()}><LogOut className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={connectWallet} className="bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-2.5 rounded-xl font-bold text-sm">
                                    Connect Wallet
                                </button>
                            )}
                        </>
                    ) : (
                        /* Optional: Add a skeleton here to prevent layout shift */
                        <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-xl" />
                    )}
                </div>
            </header>
            <div className="max-w-2xl mx-auto space-y-8 my-16">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-fuchsia-400 font-semibold transition cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Workspace Marketplace
                </button>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black">Launch Your Agent</h1>
                    <p className="text-slate-400 text-sm">Deploy your AI agent on the FluxArc marketplace. One-time listing fee of {LISTING_FEE_USDC} USDC on Arc.</p>
                </div>

                {step === 'done' ? (
                    <div className="bg-lime-500/10 border border-lime-500/30 rounded-2xl p-8 text-center space-y-3">
                        <p className="text-2xl">🎉</p>
                        <h2 className="text-xl font-bold text-lime-400">Agent Submitted!</h2>
                        <p className="text-slate-400 text-sm">Your agent is under review. It will go live on the marketplace once approved.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[
                            { key: 'name', label: 'Agent Name', placeholder: 'e.g. DataMind Analyst' },
                            { key: 'description', label: 'Description', placeholder: 'What does your agent do?' },
                            { key: 'placeholder', label: 'Input Placeholder', placeholder: 'Hint shown to users in the text box' },
                            { key: 'prompt', label: 'System Prompt', placeholder: 'You are an expert... (this is your agent\'s core instructions)' },
                            { key: 'price', label: 'Price per run (USDC)', placeholder: 'e.g. 0.25' },
                            { key: 'developer_email', label: 'Email', placeholder: 'for notifications' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">{label}</label>
                                <textarea
                                    rows={key === 'prompt' || key === 'description' ? 3 : 1}
                                    placeholder={placeholder}
                                    value={(form as any)[key]}
                                    onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full bg-[#0c0926] border border-fuchsia-900/40 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-fuchsia-500 resize-none"
                                />
                            </div>
                        ))}

                        {error && <p className="text-rose-400 text-xs font-mono">{error}</p>}

                        {mounted && (
                            <button
                                onClick={handlePayAndSubmit}
                                disabled={isPending || step === 'paying' || !isConnected}
                                className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                            >
                                {!isConnected ? 'Connect Wallet First' :
                                    step === 'paying' ? 'Confirm in wallet...' :
                                        step === 'submitting' ? 'Submitting...' :
                                            `Pay ${LISTING_FEE_USDC} USDC & Submit Agent`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}