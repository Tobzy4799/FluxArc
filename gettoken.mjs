import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const circle = initiateDeveloperControlledWalletsClient({
  apiKey: "TEST_API_KEY:368b8385551033a35d25a1e62c851578:1113cf4055b2a1d04fd6a3c5f165adc7",
  entitySecret: "7939f8b10973a1463155de0c88619aaa2ebac4a904da4179f99268801bc914ca",
});

const balances = await circle.getWalletTokenBalance({ 
  walletId: "9710df2a-cdbc-59cd-b0c8-712387d14fef" 
});

console.log(JSON.stringify(balances.data?.tokenBalances, null, 2));