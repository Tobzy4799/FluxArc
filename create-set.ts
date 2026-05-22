import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import * as dotenv from "dotenv";

// Load your secret credentials from .env.local
dotenv.config({ path: ".env.local" });

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_DEVELOPER_API_KEY || "",
  entitySecret: process.env.CIRCLE_ENTITY_SECRET || "",
});

async function run() {
  console.log("⏳ Contacting Circle to provision an autonomous agent workspace...");
  
  try {
    const response = await client.createWalletSet({
      name: "Agentix Marketplace Workers Set",
    });

    const walletSetId = response.data?.walletSet?.id;

    if (walletSetId) {
      console.log("\n====================================================");
      console.log("🎉 SUCCESS! WALLET SET PROVISIONED SUCCESSFULLY");
      console.log("====================================================");
      console.log(`\nYour WALLET_SET_ID is:\n\n${walletSetId}\n`);
      console.log("====================================================");
      console.log("Copy the ws_... string above and paste it into your .env.local file!");
    } else {
      console.error("❌ Circle responded, but no Wallet Set ID was found.", response);
    }
  } catch (error: any) {
    console.error("❌ Failed to create Wallet Set:", error?.message || error);
  }
}

run();