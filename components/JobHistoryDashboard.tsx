'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface Job {
  id: string
  job_id: string
  agent_id: string
  user_input: string
  ai_output: string | null
  status: 'processing' | 'success' | 'refunded'
  tx_hash: string | null
  created_at: string
}

interface HistoryProps {
  userWalletAddress: string | undefined
  refreshTrigger: boolean // Used to reload logs automatically when a new job finishes
}

export default function JobHistoryDashboard({ userWalletAddress, refreshTrigger }: HistoryProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

 const fetchJobHistory = useCallback(async () => {
    if (!userWalletAddress) return
    try {
      setLoading(true)
      const res = await fetch(`/api/user-jobs?wallet=${userWalletAddress}`)
      const data = await res.json()
      if (data.success) {
        setJobs(data.jobs)
      }
    } catch (err) {
      console.error('Failed to load user history logs:', err)
    } finally {
      setLoading(false)
    }
  }, [userWalletAddress]) // It only recreates if the user wallet changes

  // 3. Reload history safely when dependencies signal a refresh pass
  // Reload history safely when dependencies signal a refresh pass
  useEffect(() => {
    // 1. Maintain an active state flag to prevent state setting if component unmounts mid-fetch
    let isMounted = true

    if (!userWalletAddress) return

    // 2. Inline the asynchronous extraction logic
    const loadHistoryData = async () => {
      try {
        // Wrap state setters in a check or let the microtask handle them cleanly
        if (isMounted) setLoading(true)
        
        const res = await fetch(`/api/user-jobs?wallet=${userWalletAddress}`)
        const data = await res.json()
        
        if (data.success && isMounted) {
          setJobs(data.jobs)
        }
      } catch (err) {
        console.error('Failed to load user history logs:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // 3. Queue execution safely
    loadHistoryData()

    // 4. Cleanup function to stop cascading triggers if components swap fast
    return () => {
      isMounted = false
    }
  }, [userWalletAddress, refreshTrigger]) // Clean primitives! No more function dependencies.


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Success</span>
      case 'refunded':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Refunded</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Processing</span>
    }
  }

  if (!userWalletAddress) {
    return (
      <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        Connect your Web3 wallet to see your historical marketplace jobs.
      </div>
    )
  }

  return (
    <div className="w-full mt-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Agentix Job Vault</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Your permanent automated escrow task log records.</p>
        </div>
        <button 
          onClick={fetchJobHistory}
          disabled={loading}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
        >
          {loading ? 'Refreshing...' : 'Sync History'}
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          No jobs found for this account. Create your first contract escrow job to begin!
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="border border-zinc-800 hover:border-zinc-700 rounded-xl bg-zinc-950/60 overflow-hidden transition"
            >
              {/* Header Toggle Row */}
              <div 
                onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-zinc-200">{job.job_id}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded uppercase">{job.agent_id}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-xl">
                      <span className="text-zinc-500 font-medium">Prompt:</span> `{job.user_input}``
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-none border-zinc-900 pt-2 md:pt-0">
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  {getStatusBadge(job.status)}
                </div>
              </div>

              {/* Collapsible Inspection Panel */}
              {expandedJobId === job.id && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-950 bg-zinc-900/20 space-y-4">
                  {/* Prompt Text details */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Full User Submission Input</span>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900/60 text-sm text-zinc-300 font-medium whitespace-pre-wrap">
                      {job.user_input}
                    </div>
                  </div>

                  {/* AI Response Output Block */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Agent Computational Output</span>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900/60 text-sm font-mono text-zinc-100 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {job.ai_output || <span className="text-zinc-600 italic">No output payload generated for this lifecycle pass.</span>}
                    </div>
                  </div>

                  {/* Metadata Hash Links */}
                  {job.tx_hash && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500 font-semibold uppercase">Arc Tx Network Hash:</span>
                      <a 
                        href={`https://explorer.testnet.arc.network/tx/${job.tx_hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-indigo-400 hover:underline break-all"
                      >
                        {job.tx_hash}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}