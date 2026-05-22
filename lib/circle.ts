// lib/circle.ts
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export const getWalletIdByAddress = async (savedAddress: string) => {
  // Use your actual Wallet Set ID from the Circle Console
  const response = await client.listWallets({ walletSetId: process.env.CIRCLE_WALLET_SET_ID });
  const wallets = response.data?.wallets || [];
  
  const targetWallet = wallets.find(
    (w) => w.address?.toLowerCase() === savedAddress.toLowerCase()
  );
  
  return targetWallet?.id;
};