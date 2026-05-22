'use client'

import { useState, useCallback } from 'react'
import { AppKit } from "@circle-fin/app-kit"
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2"
import { useAccount } from 'wagmi'
import type { EIP1193Provider } from 'viem'

// Re-added your global window augmentation
declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

// Re-added your custom status type definition
type PaymentStatus = 'idle' | 'detecting' | 'approving' | 'routing' | 'success' | 'error'

// Dynamic lookup mapping network IDs to Circle internal string identifiers
const CHAIN_ID_MAP: Record<number, string> = {
  84532: 'Base_Sepolia',     // Base Sepolia Testnet
  421614: 'Arbitrum_Sepolia', // Arbitrum Sepolia Testnet
  97:    'BNB_Testnet',      // BNB Smart Chain Testnet 
  11155111: 'Ethereum_Sepolia',
  11155420: 'Optimism_Sepolia',
  10143:    'Monad_Testnet',
}

export function useAgentPayment() {
  const { address, isConnected, chainId } = useAccount()
  const [isPaying, setIsPaying] = useState<boolean>(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')

  const reset = useCallback(() => {
    setIsPaying(false)
    setPaymentStatus('idle')
  }, [])

  const processAgentPayment = useCallback(async (
    _agentId: string,
    priceUSDC: string,
    _targetAgentWallet: string
  ): Promise<boolean> => {
    if (!isConnected || !address || !chainId) return false

    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('[Bridge] No browser wallet found')
      return false
    }

    // Dynamic chain routing matching your user's current network configuration
    const sourceChainIdentifier = CHAIN_ID_MAP[chainId]

    if (!sourceChainIdentifier) {
      console.error(`[Bridge] Connected chain ID ${chainId} is not configured in CHAIN_ID_MAP.`)
      return false
    }

    setIsPaying(true)
    setPaymentStatus('detecting')

    try {
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum,
      })

      const totalToBridge = (parseFloat(priceUSDC) + 0.50).toFixed(2)
      const kit = new AppKit()

      setPaymentStatus('approving')
      console.log(`[Bridge] Bridging ${totalToBridge} USDC from ${sourceChainIdentifier} → Arc Testnet for ${address}`)

      const result = await kit.bridge({
        from: {
          adapter,
          chain: sourceChainIdentifier as any, 
        },
        to: {
          recipientAddress: address,
          chain: 'Arc_Testnet',
          useForwarder: true,
        },
        amount: totalToBridge,
      })

      console.log('[Bridge] Success:', result)
      setPaymentStatus('success')
      return true

    } catch (error: any) {
      console.error('[Bridge] Failed:', error)
      setPaymentStatus('error')
      setTimeout(() => setPaymentStatus('idle'), 2000)
      return false
    } finally {
      setIsPaying(false)
    }
  }, [isConnected, address, chainId]) 

  return {
    processAgentPayment,
    isPaying,
    paymentStatus,
    setPaymentStatus,
    reset,
  }
}