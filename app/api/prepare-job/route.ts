import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_DEVELOPER_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const YOUR_OWN_AGENT_IDS = [
  'social-manager',
  'youtube-optimizer', 
  'global-localizer',
  'solidity-auditor',
  'web-scraper'
];

export async function POST(request: Request) {
  const { agentId } = await request.json();

  // ── 1. Handle Third-party Agents ──
  if (!YOUR_OWN_AGENT_IDS.includes(agentId)) {
    const { data: thirdParty, error } = await supabase
      .from('registered_agents')
      .select('developer_wallet')
      .eq('id', agentId)
      .eq('status', 'live')
      .maybeSingle();

    if (error || !thirdParty) {
      return NextResponse.json({ success: false, error: 'Agent not found or not live.' }, { status: 404 });
    }

    return NextResponse.json({ walletAddress: thirdParty.developer_wallet });
  }

  // ── 2. Handle Your Own Agents (Circle-powered) ──
 const { data: record } = await supabase
    .from('agent_wallets')
    .select('wallet_address')
    .eq('agent_id', agentId)
    .maybeSingle();

  // If missing, provision from Circle
  if (!record) {
    const walletResponse = await circleClient.createWallets({
      walletSetId: process.env.CIRCLE_WALLET_SET_ID!,
      blockchains: ['ARC-TESTNET'],
      count: 1
    });

    if (!walletResponse.data?.wallets?.length) {
      return NextResponse.json({ success: false, error: "Failed to provision wallet." }, { status: 500 });
    }

    const newWallet = walletResponse.data.wallets[0];
    const { error: insertError } = await supabase.from('agent_wallets').insert([{
      agent_id: agentId,
      wallet_address: newWallet.address,
      wallet_id: newWallet.id
    }]);

    if (insertError) {
      return NextResponse.json({ success: false, error: "Database error." }, { status: 500 });
    }

    return NextResponse.json({ walletAddress: newWallet.address });
  }

  return NextResponse.json({ walletAddress: record.wallet_address });
}