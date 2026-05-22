'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const circle = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_DEVELOPER_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,

});

export async function getWalletBalance(walletId: string) {
  try {
    const response = await circle.getWalletTokenBalance({ id: walletId });
    console.log("Full Circle API Response:", JSON.stringify(response.data, null, 2)); // Add this
    return { success: true, balances: response.data?.tokenBalances };
  } catch (error: any) {
    console.error("API Error details:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

export async function processWithdrawal(walletId: string, amount: string, destinationAddress: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== 'oluwatjtunjex@gmail.com') {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const response = await circle.createTransaction({
      walletId: walletId,
      destinationAddress: destinationAddress,
      amount: [amount],
      tokenId: process.env.USDC_TOKEN_ID!, 
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      idempotencyKey: crypto.randomUUID(),
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}