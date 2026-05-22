export const AGENTIX_ESCROW_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createJob",
    "inputs": [
      { "name": "_jobId", "type": "string", "internalType": "string" },
      { "name": "_workerAgentWallet", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "releaseJob",
    "inputs": [
      { "name": "_jobId", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "refundJob",
    "inputs": [
      { "name": "_jobId", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registry",
    "inputs": [
      { "name": "", "type": "string", "internalType": "string" }
    ],
    "outputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "workerAgentWallet", "type": "address", "internalType": "address" },
      { "name": "escrowAmount", "type": "uint256", "internalType": "uint256" },
      { "name": "status", "type": "uint8", "internalType": "enum AgentixEscrow.JobStatus" }
    ],
    "stateMutability": "view"
  }
] as const; // "as const" gives TypeScript optimal inference for wagmi hooks!