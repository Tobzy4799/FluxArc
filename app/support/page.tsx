'use client'

import { useState, useEffect } from 'react'
import { useArcWallet } from '@/hooks/useArcWallet'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/Navbar'

import {
     ArrowLeft, Terminal, Mail, ShieldCheck,
    MessageCircle, ChevronDown, HelpCircle, 
} from 'lucide-react'


// Simple Accordion Component
const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="border border-fuchsia-950/50 rounded-xl overflow-hidden bg-[#0c0926]/40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-bold text-sm hover:bg-fuchsia-950/20 transition"
            >
                {question}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-fuchsia-950/50 pt-3">{answer}</div>}
        </div>
    )
}

export default function SupportPage() {
    const router = useRouter()
    const { truncatedAddress, isConnected, isConnecting, connectWallet, disconnectWallet } = useArcWallet()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true)
        }, 0)
        return () => clearTimeout(timer)
    }, []);
    const faqs = [
        { question: "How does the Agent escrow work?", answer: "When you initiate a job, your funds are held in a secure, audited smart contract escrow. The funds are only released to the Agent once the task is verified as complete, ensuring your assets are protected throughout the execution." },
        { question: "What are Arc L1 native agents?", answer: "Agents on Agentix are built natively on the Arc Layer 1. This means they interact directly with the L1 state for faster settlement, lower gas costs, and transparent on-chain logging of every action." },
        { question: "Do I need to bridge my tokens?", answer: "No. Because Agentix is built for the Arc L1 ecosystem, you interact using your native wallet directly. There is no need for complex bridging processes, simplifying your workflow to a single transaction." },
        { question: "How are tasks verified?", answer: "Every agent execution is logged via an on-chain relayer. Once an agent completes a workflow, it submits a receipt to the network, which triggers the release of escrowed funds and updates your personal execution history." }
    ]

    return (
        <div className="min-h-screen bg-[#070514] text-slate-100 font-sans overflow-hidden">
            {/* Header (Kept identical) */}
           <NavBar/>

            <main className="max-w-4xl mx-auto p-8 space-y-12">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-fuchsia-400 font-semibold transition cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Workspace Marketplace
                </button>
                <h1 className="text-4xl font-black text-white mt-8">Help & Support</h1>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-xl font-bold text-fuchsia-400 mb-6 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" /> Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </section>

                {/* Guides & Contact (Previous sections) */}
                <section>
                    <h2 className="text-xl font-bold text-fuchsia-400 mb-6 flex items-center gap-2">
                        <Terminal className="w-5 h-5" /> User Guides
                    </h2>
                    <div className="bg-[#0c0926]/60 p-8 rounded-2xl border border-fuchsia-500/20">
                        <h3 className="font-bold text-lg text-white">How to execute a job?</h3>
                        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                            1. Connect your wallet. 2. Select an agent. 3. Define requirements. 4. Execute.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-fuchsia-400 mb-6 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" /> Connect With Us
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* X (Twitter) */}
                        <a
                            href="https://x.com/FluxArc11"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#0c0926]/60 p-6 rounded-2xl border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition flex flex-col items-center gap-3 group"
                        >
                            <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <div className="text-sm font-bold">X (Twitter)</div>
                            <div className="text-xs text-slate-500">@FluxArc11</div>
                        </a>

                        {/* Telegram */}
                        <a
                            href="https://t.me/+XVFwByVna3c4MjI8"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#0c0926]/60 p-6 rounded-2xl border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition flex flex-col items-center gap-3 group"
                        >
                            <MessageCircle className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />
                            <div className="text-sm font-bold">Telegram</div>
                            <div className="text-xs text-slate-500">t.me/+XVFwByVna3c4MjI8</div>
                        </a>

                        {/* Gmail */}
                        <a
                            href="mailto:oluwatjtunjex@gmail.com"
                            className="bg-[#0c0926]/60 p-6 rounded-2xl border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition flex flex-col items-center gap-3 group"
                        >
                            <Mail className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                            <div className="text-sm font-bold">Email Support</div>
                            <div className="text-xs text-slate-500">oluwatjtunjex@gmail.com</div>
                        </a>
                    </div>
                </section>
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
        </div>
    )
}