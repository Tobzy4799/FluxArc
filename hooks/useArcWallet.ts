'use client'

import { useSyncExternalStore } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { arcTestnet } from '@/config/web3' // Adjust this import path to match your configuration setup

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function useArcWallet() {
  // Safe SSR/Hydration checker to prevent React state mismatch warnings
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const { address, status, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()

  const connectWallet = async () => {
    try {
      const primaryConnector = connectors[0]
      
      if (primaryConnector) {
        connect({ 
          connector: primaryConnector, 
          chainId: arcTestnet.id 
        })
      } else {
        alert("No Web3 wallet extension detected. Please install a wallet provider like MetaMask or Rabby!")
      }
    } catch (error) {
      console.error("Failed to initiate wallet connection:", error)
    }
  }

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : ''

  // Fallback defaults for server-side processing
  if (!isClient) {
    return {
      address: undefined,
      truncatedAddress: '',
      isConnected: false,
      isConnecting: false,
      chainId: undefined,
      connectWallet,
      disconnectWallet: disconnect,
      switchToArc: async () => {}
    }
  }

  // Programmatically forces the wallet to change networks to Arc Testnet
  const switchToArc = async () => {
    if (chainId !== arcTestnet.id && switchChainAsync) {
      console.log(`[Wallet Action] Swapping active provider chain context to Arc Testnet (${arcTestnet.id})...`)
      try {
        await switchChainAsync({ chainId: arcTestnet.id })
      } catch (switchError: any) {
        console.error("User rejected or network switch failed:", switchError)
        throw new Error("Wallet must be switched to the Arc Network to deposit into the Escrow contract.")
      }
    } else {
      console.log("[Wallet Action] Wallet is already safely configured to Arc Network layer.")
    }
  }

  return {
    address,
    truncatedAddress,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    chainId,
    connectWallet,
    disconnectWallet: disconnect,
    switchToArc 
  }
}