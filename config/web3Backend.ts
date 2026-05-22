// Centralized backend configuration loader

export const BACKEND_CONFIG = {
  arcRpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  arcChainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '5042002'),
  circleApiKey: process.env.CIRCLE_DEVELOPER_API_KEY || '',
  circleWalletSetId: process.env.CIRCLE_WALLET_SET_ID || '',
  escrowPrivateKey: process.env.BACKEND_ESCROW_PRIVATE_KEY || ''
}

// Simple internal helper to check if backend environment keys are loaded
export function verifyBackendEnv() {
  const missing = []
  if (!BACKEND_CONFIG.circleApiKey) missing.push('CIRCLE_DEVELOPER_API_KEY')
  if (!BACKEND_CONFIG.circleWalletSetId) missing.push('CIRCLE_WALLET_SET_ID')
  
  if (missing.length > 0) {
    console.warn(`[⚠️ Configuration Warning]: Missing keys: ${missing.join(', ')}. Running in sandbox fallback mode.`)
    return false
  }
  return true
}