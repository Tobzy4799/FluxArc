import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')?.toLowerCase()

    if (!address) {
      return NextResponse.json({ success: false, error: 'Wallet address parameter is required.' }, { status: 400 })
    }

    // 1. Grab specific user point counts
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('points')
      .eq('wallet_address', address)
      .maybeSingle()

    // NEW: Fetch specific user execution history jobs to return to the profile component
    const { data: userSpecificJobs } = await supabase
      .from('user_jobs')
      .select('job_id, agent_id, status, created_at, tx_hash')
      .eq('user_wallet', address)
      .order('created_at', { ascending: false })

    // 2. Fetch the latest live global jobs across the platform for your global feed ticker
    const { data: recentJobs } = await supabase
      .from('user_jobs')
      .select('user_wallet, agent_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8)

    // 3. Compute dynamic platform milestones directly from DB history logs
    const { count: totalTasksExecuted } = await supabase
      .from('user_jobs')
      .select('*', { count: 'exact', head: true })

    // Count unique user wallets that have interacted with your platform
    const { data: uniqueUsers } = await supabase
      .from('user_jobs')
      .select('user_wallet')

    const uniqueWalletCount = uniqueUsers 
      ? new Set(uniqueUsers.map(job => job.user_wallet.toLowerCase())).size 
      : 0

    // 4. Calculate actual dynamic volume processed from historical successful rows
    const { data: allSuccessfulJobs } = await supabase
      .from('user_jobs')
      .select('agent_id')
      .eq('status', 'success')

    // Map your agent static prices to calculate on-the-fly volumes
    const priceMap: Record<string, number> = {
      'social-manager': 0.10,
      'youtube-optimizer': 0.25,
      'global-localizer': 0.15,
      'solidity-auditor': 0.50,
      'web-scraper': 0.20
    }

    const totalVolume = allSuccessfulJobs?.reduce((sum, job) => {
      const cost = priceMap[job.agent_id] || 0
      return sum + cost
    }, 0) || 0

    // Build functional human-friendly activity logs out of database realities
    const liveActivities = recentJobs?.map(job => {
      const displayWallet = `${job.user_wallet.slice(0, 6)}...${job.user_wallet.slice(-4)}`
      const cleanAgentName = job.agent_id.replace('-', ' ')
      return `Wallet ${displayWallet} executed ${cleanAgentName} task with status: [${job.status.toUpperCase()}]`
    }) || []

    return NextResponse.json({
      success: true,
      points: profile?.points || 0,
      tasksExecuted: totalTasksExecuted || 0,
      activeWallets: uniqueWalletCount || 0,
      totalVolume: totalVolume,
      liveActivities: liveActivities.length > 0 ? liveActivities : null,
      jobs: userSpecificJobs || [] // Returned directly to load historyLogs state array
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}