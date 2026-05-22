import { loadEnvFile } from 'node:process';
import path from 'node:path';

// Load .env.local from the project root
loadEnvFile(path.resolve(__dirname, '../.env.local'));

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from '@supabase/supabase-js';

// Initialize Clients
const circle = initiateDeveloperControlledWalletsClient({
  // Use the key name as it exists in your .env.local
  apiKey: process.env.CIRCLE_DEVELOPER_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncWalletIds() {
  console.log("Starting wallet synchronization...");

  try {
    const response = await circle.listWallets({ 
      walletSetId: process.env.CIRCLE_WALLET_SET_ID! 
    });
    
    const circleWallets = response.data?.wallets || [];
    console.log(`Found ${circleWallets.length} wallets in Circle.`);

    for (const w of circleWallets) {
      if (!w.address) continue;

      const { error } = await supabase
        .from('agent_wallets')
        .update({ wallet_id: w.id })
        .eq('wallet_address', w.address.toLowerCase());

      if (error) {
        console.error(`Failed to update ${w.address}:`, error.message);
      } else {
        console.log(`Successfully synced: ${w.address} -> ${w.id}`);
      }
    }
    console.log("Synchronization complete.");
  } catch (err) {
    console.error("Critical error during sync:", err);
  }
}

syncWalletIds();