import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
import * as dotenv from "dotenv";

// Pull keys from your local config
dotenv.config({ path: ".env.local" });

async function run() {
  console.log("⏳ Syncing and registering your Entity Secret securely with Circle...");

  const apiKey = process.env.CIRCLE_DEVELOPER_API_KEY ?? "";
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET ?? "";

  if (!apiKey || !entitySecret) {
    console.error("❌ Missing CIRCLE_DEVELOPER_API_KEY or CIRCLE_ENTITY_SECRET in .env.local");
    return;
  }

  try {
    const response = await registerEntitySecretCiphertext({
      apiKey: apiKey,
      entitySecret: entitySecret,
      recoveryFileDownloadPath: "./", // This automatically saves your master recovery file here
    });

    console.log("\n====================================================");
    console.log("🎉 SUCCESS! ENTITY SECRET HANDSHAKE COMPLETE");
    console.log("====================================================");
    console.log("Your Entity Secret is now registered on Circle's servers.");
    console.log("A secure backup 'recovery_file' has been generated in your folder.");
    console.log("====================================================\n");
    
  } catch (error: any) {
    console.error("❌ Registration failed:", error?.message || error);
  }
}

run();