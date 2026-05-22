'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { processWithdrawal, getWalletBalance } from '@/app/actions/withdraw';
import { LogOut, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PendingAgent {
  id: string
  name: string
  description: string
  price: string
  developer_wallet: string
  developer_email: string | null
  status: string
  created_at: string
}

export default function WithdrawForm({ wallets }: { wallets: any[] }) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch pending agents on mount
  useEffect(() => {
    const fetchPendingAgents = async () => {
      const res = await fetch('/api/agents/pending')
      const data = await res.json()
      if (data.success) setPendingAgents(data.agents)
    }

    fetchPendingAgents()
  }, [])

  const handleApprove = async (agentId: string, action: 'approve' | 'reject') => {
    setApprovingId(agentId)
    try {
      const res = await fetch('/api/agents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action })
      })
      const data = await res.json()
      if (data.success) {
        // Remove from list optimistically
        setPendingAgents(prev => prev.filter(a => a.id !== agentId))
      }
    } catch (err) {
      console.error('Approval failed:', err)
    } finally {
      setApprovingId(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleWalletChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const walletId = e.target.value;
    if (!walletId) return;
    setBalance("Fetching...");
    const result = await getWalletBalance(walletId);
    if (result.success && result.balances) {
      const usdc = result.balances.find(
        (b: any) => b.token.id === process.env.NEXT_PUBLIC_USDC_TOKEN_ID
      );
      if (usdc) setBalance(`${usdc.amount} USDC`);
      else setBalance("Token ID not found in wallet");
    } else {
      setBalance("Error fetching balance");
    }
  };

  const handleWithdraw = async (formData: FormData) => {
    setLoading(true);
    const walletId = formData.get('walletId') as string;
    const amount = formData.get('amount') as string;
    const destination = '0xe0Ef9917C8969f2AAD6a9A75edC0a72D928f6C7F';
    const result = await processWithdrawal(walletId, amount, destination);
    if (result.success) alert("Withdrawal initiated successfully!");
    else alert("Failed: " + result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05030f] p-6">
      <div className="max-w-3xl mx-auto space-y-8 my-10">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-[#0e0b2e]/30 border border-fuchsia-900/30 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Withdraw Funds</h2>
          <form action={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Select Wallet</label>
              <select name="walletId" onChange={handleWalletChange} className="w-full p-3 bg-[#05030f] border border-fuchsia-900/30 rounded-lg text-white" required>
                <option value="">Select a wallet...</option>
                {wallets.map(w => (
                  <option key={w.wallet_id} value={w.wallet_id}>{w.wallet_address}</option>
                ))}
              </select>
              {balance && <p className="text-sm text-lime-400 mt-2 font-mono">Available: {balance}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Amount (USDC)</label>
              <input name="amount" type="number" step="0.01" className="w-full p-3 bg-[#05030f] border border-fuchsia-900/30 rounded-lg text-white" required />
            </div>
            <button disabled={loading} className="w-full bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-600 hover:text-white py-3 rounded-lg font-bold transition-all">
              {loading ? 'Processing...' : 'Withdraw to wallet'}
            </button>
          </form>
        </div>

        {/* Pending Agent Approvals */}
        <div className="bg-[#0e0b2e]/30 border border-fuchsia-900/30 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Pending Agent Approvals</h2>
            {pendingAgents.length > 0 && (
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold px-2 py-0.5 rounded font-mono">
                {pendingAgents.length}
              </span>
            )}
          </div>

          {pendingAgents.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-fuchsia-950/40 rounded-xl">
              <p className="text-slate-500 text-sm font-mono">No pending submissions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAgents.map((agent) => (
                <div key={agent.id} className="bg-[#070514] border border-fuchsia-950/50 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{agent.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">/{agent.id}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{agent.description}</p>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                        <span>Price: <span className="text-lime-400">{agent.price} USDC</span></span>
                        <span>Dev wallet: <span className="text-fuchsia-400">{agent.developer_wallet.slice(0, 10)}...</span></span>
                        {agent.developer_email && (
                          <span>
                            Email:{" "}
                            <a
                              href={`mailto:${agent.developer_email}?subject=Regarding your agent: ${agent.name}`}
                              className="text-fuchsia-300 hover:underline"
                            >
                              {agent.developer_email}
                            </a>
                          </span>
                        )}
                        <span>Submitted: {new Date(agent.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(agent.id, 'approve')}
                      disabled={approvingId === agent.id}
                      className="flex items-center gap-1.5 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 text-lime-400 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {approvingId === agent.id ? 'Processing...' : 'Approve & Go Live'}
                    </button>
                    <button
                      onClick={() => handleApprove(agent.id, 'reject')}
                      disabled={approvingId === agent.id}
                      className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
