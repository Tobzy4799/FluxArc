'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, CheckCircle2, Cpu, Loader2, ArrowRight, RefreshCw } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { AGENTIX_ESCROW_ABI } from '@/constants/escrowAbi'
import { arcTestnet } from '@/config/web3'
import ArtifactActions from '@/components/ArtifactActions'

const USDC_DECIMALS = 6

interface AgentWorkspaceProps {
  agentId: string
  placeholder: string
  price: string
  agentWalletAddress: string
  onExecutePayment?: (agentId: string, priceUSDC: string, targetAgentWallet: string) => Promise<boolean>
}

type BridgeStep = 'idle' | 'approving' | 'burning' | 'minting' | 'switching' | 'done'

export function AgentExecutionWorkspace({
  agentId,
  placeholder,
  price,
  agentWalletAddress,
  onExecutePayment
}: AgentWorkspaceProps) {
  const { isConnected, address, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const [prompt, setPrompt] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isProcessingBackend, setIsProcessingBackend] = useState(false)
  const [agentOutput, setAgentOutput] = useState<string | null>(null)
  const [activeJobMetadata, setActiveJobMetadata] = useState<{ jobId: string; wallet: string } | null>(null)

  const [bridgeSuccessful, setBridgeSuccessful] = useState(false)
  const [isBridging, setIsBridging] = useState(false)
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>('idle')
  const [currentJobId, setCurrentJobId] = useState('')

  const currentJobIdRef = useRef('')
  const promptRef = useRef('')

  const {
    data: txHash,
    writeContract,
    reset: resetWriteContract,
    isPending: isSigningInWallet
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        setStatusMessage(`Contract Exception: ${error.message.split('\n')[0]}`)
      }
    }
  })

  const {
    data: txReceipt,
    isLoading: isWaitingForBlock,
    isSuccess: isConfirmedOnChain
  } = useWaitForTransactionReceipt({ hash: txHash })

  const isCurrentlyOnArc = chainId === arcTestnet.id

  const stableResetWriteContract = useCallback(() => {
    resetWriteContract()
  }, [resetWriteContract])

  const resetAllState = useCallback(() => {
    setBridgeSuccessful(false)
    setBridgeStep('idle')
    setIsBridging(false)
    setStatusMessage('')
    setAgentOutput(null)
    setActiveJobMetadata(null)
    setCurrentJobId('')
    currentJobIdRef.current = ''
    setIsProcessingBackend(false)
    stableResetWriteContract()
  }, [stableResetWriteContract])

  const getBridgeStepLabel = () => {
    switch (bridgeStep) {
      case 'approving': return 'Step 1/3 — Sign Approval in Wallet...'
      case 'burning': return 'Step 2/3 — Sign Bridge Transaction...'
      case 'minting': return 'Step 3/3 — Circle Forwarding Minting on Arc...'
      case 'switching': return 'Switching to Arc Testnet...'
      default: return 'Processing Cross-Chain Pipeline...'
    }
  }

  const handleBridgeTokens = async () => {
    if (!prompt.trim() || !onExecutePayment) return

    resetAllState()
    setIsBridging(true)
    setBridgeStep('approving')
    promptRef.current = prompt
    setStatusMessage('Step 1/3: Waiting for USDC approval signature...')

    const burnTimer = setTimeout(() => {
      setBridgeStep('burning')
      setStatusMessage('Step 2/3: Waiting for bridge/burn signature...')
    }, 2000)

    const mintTimer = setTimeout(() => {
      setBridgeStep('minting')
      setStatusMessage('Step 3/3: Circle Forwarding Service minting USDC on Arc...')
    }, 15000)

    try {
      if (!agentWalletAddress) {
        setStatusMessage("Agent wallet not initialized. Please wait or refresh.");
        return;
      }
      const targetWorkerWallet = agentWalletAddress;
      const bridgeCleared = await onExecutePayment(agentId, price, targetWorkerWallet)

      clearTimeout(burnTimer)
      clearTimeout(mintTimer)

      if (!bridgeCleared) {
        setStatusMessage('Bridge was canceled or failed. You can try again.')
        setBridgeStep('idle')
        setIsBridging(false)
        return
      }

      setBridgeStep('switching')
      setStatusMessage('✅ USDC bridged! Switching wallet to Arc Testnet...')

      try {
        await switchChainAsync({ chainId: arcTestnet.id })
        setBridgeSuccessful(true)
        setBridgeStep('done')
        setStatusMessage('✅ On Arc Testnet! Click "Deposit Escrow & Hire Worker" to complete.')
      } catch {
        setBridgeSuccessful(true)
        setBridgeStep('done')
        setStatusMessage('✅ Bridge complete! Switch your wallet to Arc Testnet, then deposit escrow.')
      }

    } catch (bridgeErr: any) {
      clearTimeout(burnTimer)
      clearTimeout(mintTimer)
      setStatusMessage(`Bridge Error: ${bridgeErr.message}`)
      setBridgeStep('idle')
    } finally {
      setIsBridging(false)
    }
  }

  const handleEscrowAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!isCurrentlyOnArc) {
      setStatusMessage('Please switch your wallet to Arc Testnet first.');
      return;
    }

    const amountBI = parseUnits(price, 18)
    const generatedJobId = `job-${agentId}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()}`;

    try {
      setStatusMessage('Initializing Agent Workspace...');
      const res = await fetch('/api/prepare-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      const data = await res.json();
      if (!data.walletAddress) throw new Error("Could not retrieve agent wallet.");

      setStatusMessage('Depositing USDC into escrow...');
      currentJobIdRef.current = generatedJobId;
      setCurrentJobId(generatedJobId);

      writeContract({
        address: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: AGENTIX_ESCROW_ABI,
        functionName: 'createJob',
        args: [generatedJobId, data.walletAddress as `0x${string}`],
        value: amountBI,
      });
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (
      isConfirmedOnChain &&
      txReceipt &&
      currentJobIdRef.current &&
      currentJobIdRef.current === currentJobId &&
      !isProcessingBackend &&
      !agentOutput
    ) {
      const callBackendAgent = async () => {
        try {
          setIsProcessingBackend(true)
          setStatusMessage('Escrow locked on-chain! Launching agent...')

          const response = await fetch('/api/hire-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId,
              price,
              userInput: promptRef.current || prompt,
              walletAddress: address,
              jobId: currentJobIdRef.current
            })
          })

          const data = await response.json()
          if (!data.success) throw new Error(data.error || 'Agent pipeline failed.')

          setAgentOutput(data.agentOutput)
          setActiveJobMetadata({
            jobId: currentJobIdRef.current,
            wallet: agentWalletAddress || '0xfd6a467f67df244dfd2f3568978c2f27f1e3a7c0'
          })
          setStatusMessage('✅ Task complete! Funds distributed to agent.')
          setBridgeSuccessful(false)
          setBridgeStep('idle')
          currentJobIdRef.current = ''
          stableResetWriteContract()

        } catch (err: any) {
          setStatusMessage(`Agent Error: ${err.message}`)
          currentJobIdRef.current = ''
          setCurrentJobId('')
        } finally {
          setIsProcessingBackend(false)
        }
      }

      callBackendAgent()
    }
  }, [
    isConfirmedOnChain,
    txReceipt,
    currentJobId,
    agentId,
    price,
    address,
    agentWalletAddress,
    isProcessingBackend,
    agentOutput,
    prompt,
    stableResetWriteContract,
  ])

  const totalProcessingActive = isSigningInWallet || isWaitingForBlock || isProcessingBackend || isBridging

  const renderActionButton = () => {
    if (!isConnected) {
      return (
        <button className="text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl font-mono">
          Connect Wallet First
        </button>
      )
    }

    if (!prompt.trim()) {
      return (
        <button disabled className="bg-slate-800 text-slate-500 px-6 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed opacity-50">
          Enter Prompt First
        </button>
      )
    }

    if (isBridging) {
      return (
        <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-6 py-2.5 rounded-xl font-bold text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          {getBridgeStepLabel()}
        </div>
      )
    }

    if (isSigningInWallet || (isWaitingForBlock && currentJobId) || isProcessingBackend) {
      return (
        <div className="flex items-center gap-2 bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 px-6 py-2.5 rounded-xl font-bold text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isSigningInWallet && 'Signing Escrow Deposit...'}
          {(isWaitingForBlock && currentJobId) && 'Confirming on Arc Network...'}
          {isProcessingBackend && 'Running Agent...'}
        </div>
      )
    }

    if (!isCurrentlyOnArc && !bridgeSuccessful) {
      return (
        <button
          type="button"
          onClick={handleBridgeTokens}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer"
        >
          Bridge USDC to Arc Network <ArrowRight className="w-4 h-4" />
        </button>
      )
    }

    if (!isCurrentlyOnArc && bridgeSuccessful) {
      return (
        <button
          type="button"
          onClick={async () => {
            try {
              await switchChainAsync({ chainId: arcTestnet.id })
            } catch {
              setStatusMessage('Please switch to Arc Testnet manually in your wallet.')
            }
          }}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Switch to Arc Testnet
        </button>
      )
    }

    return (
      <button
        type="submit"
        className="bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-xl cursor-pointer"
      >
        Deposit Escrow & Hire Worker
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0824] border border-fuchsia-500/20 rounded-2xl p-6 md:p-8 relative space-y-6">
        <div className="flex items-center gap-3 border-b border-fuchsia-950/60 pb-4">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-fuchsia-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Execution Input Workspace</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Lock <span className="text-lime-400 font-bold font-mono">{price} USDC</span> in Escrow to run.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="text-[9px] text-emerald-300 mb-2 font-mono italic">
          Bridging to arc will incur a forwarding fee of 0.35 USDC
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className={bridgeStep === 'approving' ? 'text-blue-400 font-bold' : bridgeStep !== 'idle' ? 'text-slate-400' : ''}>
            1. Approve USDC
          </span>
          <span>→</span>
          <span className={bridgeStep === 'burning' ? 'text-blue-400 font-bold' : ['minting', 'switching', 'done'].includes(bridgeStep) ? 'text-slate-400' : ''}>
            2. Bridge to Arc
          </span>
          <span>→</span>
          <span className={bridgeStep === 'minting' ? 'text-blue-400 font-bold' : ['switching', 'done'].includes(bridgeStep) ? 'text-slate-400' : ''}>
            3. USDC Minted on Arc
          </span>
          <span>→</span>
          <span className={isSigningInWallet ? 'text-fuchsia-400 font-bold' : (isConfirmedOnChain && currentJobId) ? 'text-lime-400 font-bold' : ''}>
            4. Deposit Escrow
          </span>
        </div>

        <form onSubmit={handleEscrowAndExecute} className="space-y-4">
          <label className="block text-xs uppercase tracking-wider font-mono text-slate-400 font-semibold">
            Provide Guidelines / Input Data for the Agent:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={5}
            disabled={totalProcessingActive}
            className="w-full bg-[#05030f] border border-fuchsia-900/40 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-fuchsia-500/60 transition-all font-sans leading-relaxed resize-none disabled:opacity-50"
          />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Requires on-chain contract interaction authorization.</span>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
              {renderActionButton()}
            </div>
          </div>
        </form>

        {statusMessage && (
          <p className="text-xs font-mono text-fuchsia-400 mt-2 bg-fuchsia-950/10 p-3 rounded-lg border border-fuchsia-900/20">
            ⚡ {statusMessage}
          </p>
        )}
      </div>

      {agentOutput && activeJobMetadata && (
        <div className="bg-[#05030f] border border-lime-500/30 rounded-2xl p-6 font-mono text-xs relative space-y-4 shadow-xl shadow-lime-950/10">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 text-slate-400">
            <div className="flex items-center gap-2 text-lime-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[10px]">On-Chain Verified Result</span>
            </div>
            <div>JOB_ID: <span className="text-slate-200">{activeJobMetadata.jobId}</span></div>
          </div>
          <div className="text-slate-300 max-h-[400px] overflow-y-auto whitespace-pre-wrap font-sans text-sm bg-[#080617]/50 border border-slate-900 p-4 rounded-xl">
            {agentOutput}
          </div>

          {/* Artifact Actions Integrated Here */}
          <div className="border-t border-slate-900 pt-4">
            <ArtifactActions
              agentId={agentId}
              output={agentOutput}
            />
          </div>
        </div>
      )}
    </div>
  )
}