import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'
import { baseSepolia, arbitrumSepolia, sepolia, optimismSepolia } from 'wagmi/chains' // 1. Imported optimismSepolia

// Explicit definition for Monad Testnet
export const monadTestnet = defineChain({
  id: 10143, // Monad Testnet ChainID
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] }, 
  },
})

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
})

export const wagmiConfig = createConfig({
  // 2. Added optimismSepolia to the target networks array
  chains: [baseSepolia, arbitrumSepolia, sepolia, optimismSepolia, monadTestnet, arcTestnet],
  
  connectors: [injected()], 
  
  transports: {
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(), // 3. Registered OP Sepolia's transport layer
    [monadTestnet.id]: http(),
    [arcTestnet.id]: http(),
  },
})