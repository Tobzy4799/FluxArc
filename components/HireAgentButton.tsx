"use client";

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { AGENTIX_ESCROW_ABI } from '@/constants/escrowAbi';

interface HireAgentButtonProps {
  jobId: string;
  agentId: string;
  priceInUsdc: string;
  onSuccess?: (txHash: string) => void;
}

export function HireAgentButton({ jobId, agentId, priceInUsdc, onSuccess }: HireAgentButtonProps) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleHire = async () => {
    try {
      setErrorMsg(null);
      setIsProvisioning(true);

      // 1. Fetch or create the Circle wallet for this agent on ARC-TESTNET
      const res = await fetch('/api/prepare-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();

      if (!data.walletAddress) throw new Error("Could not initialize agent wallet.");

      // 2. Deposit into escrow — passes the Circle wallet address as the worker
      const finalJobId = `${jobId}-${Date.now()}`;
      writeContract({
        address: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: AGENTIX_ESCROW_ABI,
        functionName: 'createJob',
        args: [finalJobId, data.walletAddress as `0x${string}`],
        value: parseUnits(priceInUsdc, 18),
      });
    } catch (err: any) {
      console.error("Hire failed:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsProvisioning(false);
    }
  };

  useEffect(() => {
    if (isSuccess && hash && onSuccess) {
      onSuccess(hash);
    }
  }, [isSuccess, hash, onSuccess]);

  const isLoading = isPending || isConfirming || isProvisioning;

  return (
    <div className="space-y-2">
      <button
        disabled={isLoading}
        onClick={handleHire}
        className="w-full sm:w-auto text-center px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg cursor-pointer"
      >
        {isProvisioning
          ? 'Provisioning Agent Wallet...'
          : isPending
          ? 'Signing Transaction...'
          : isConfirming
          ? 'Locking Funds on Arc...'
          : 'Hire Autonomous Agent'}
      </button>
      {errorMsg && (
        <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>
      )}
    </div>
  );
}