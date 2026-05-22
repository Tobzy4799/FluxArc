import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { agentId, action } = await req.json() // action: 'approve' | 'reject'

  const status = action === 'approve' ? 'live' : 'rejected'

  const { error } = await supabase
    .from('registered_agents')
    .update({ status })
    .eq('id', agentId)

  if (error) return NextResponse.json({ success: false }, { status: 500 })
  return NextResponse.json({ success: true })
}