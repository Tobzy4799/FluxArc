import { NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createWalletClient, http, publicActions, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AGENTIX_ESCROW_ABI } from "@/constants/escrowAbi";

const AGENT_PROMPTS: Record<string, string> = {
  "social-manager":
    "You are SocialPulse Marketer, an expert growth hacker. Generate highly viral social media copy, hooks, and content schedules based on the user business concept.",
  "youtube-optimizer":
    "You are YT Viral Catalyst. Take video concepts and turn them into high-retention YouTube scripts, engaging SEO titles, and keyword-optimized descriptions.",
  "global-localizer":
    "You are LinguaBridge AI. Translate and culturally localize business copy flawlessly into the requested target languages, maintaining an exciting tone.",
  "solidity-auditor":
    "You are Solidity Guard AI, a critical smart contract security auditor. Scan the provided contract carefully for reentrancy bugs, integer overflows, logic vulnerabilities, and gas optimizations.",
  "web-scraper":
    "You are ScrapeMaster Pro. Take the target website request and logically map out exactly how a structural web scraper should extract its pricing and data cleanly.",
};

// Platform fee: 5% goes to your Circle wallet, 95% to the third-party developer
const PLATFORM_FEE_BPS = 500; // 5% in basis points (500/10000)

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_DEVELOPER_API_KEY || "",
    entitySecret: process.env.CIRCLE_ENTITY_SECRET || "",
  });

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network";

  const arcTestnet = defineChain({
    id: 42746715,
    name: "Arc Testnet",
    nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  });

  const relayerPrivateKey = process.env
    .BACKEND_RELAYER_PRIVATE_KEY as `0x${string}`;
  const contractAddress = process.env
    .NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`;
  const account = privateKeyToAccount(relayerPrivateKey);

  const relayerClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(rpcUrl),
  }).extend(publicActions);

  let trackingJobId = "";

  try {
    const body = await request.json();
    const { agentId, price, userInput, walletAddress, jobId } = body;
    trackingJobId = jobId;

    if (!agentId || !userInput || !walletAddress || !jobId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 },
      );
    }

    const cleanWalletAddress = walletAddress.toLowerCase();
    console.log(`[API] Processing request for Agent: ${agentId}`);

    // Track job initiation
    await supabase.from("user_jobs").insert([
      {
        job_id: jobId,
        user_wallet: cleanWalletAddress,
        agent_id: agentId,
        user_input: userInput,
        status: "processing",
      },
    ]);

    // ─── STEP 1: Determine if this is your agent or a third-party agent ───
    let system = AGENT_PROMPTS[agentId];
    let isThirdPartyAgent = false;
    let thirdPartyDeveloperWallet: string | null = null;

    if (!system) {
      // Not one of your built-in agents — check the registered_agents table
      const { data: thirdPartyAgent } = await supabase
        .from("registered_agents")
        .select("prompt, developer_wallet")
        .eq("id", agentId)
        .eq("status", "live")
        .maybeSingle();

      if (thirdPartyAgent) {
        system = thirdPartyAgent.prompt;
        isThirdPartyAgent = true;
        thirdPartyDeveloperWallet = thirdPartyAgent.developer_wallet;
        console.log(
          `[API] Third-party agent detected: ${agentId}, developer wallet: ${thirdPartyDeveloperWallet}`,
        );
      } else {
        system = "You are a helpful assistant.";
      }
    }

    // ─── STEP 2: Resolve the agent wallet ───
    const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    if (!walletSetId)
      throw new Error("Missing CIRCLE_WALLET_SET_ID configuration.");

    let agentWalletAddress: string | undefined;

    if (isThirdPartyAgent && thirdPartyDeveloperWallet) {
      // Third-party agents: escrow releases to their wallet directly
      // No Circle wallet needed — they receive on their own Arc wallet
      agentWalletAddress = thirdPartyDeveloperWallet;
      console.log(
        `[API] Using third-party developer wallet: ${agentWalletAddress}`,
      );
    } else {
      // Your own agents: check DB for existing Circle wallet, create if missing
      const { data: dbRecord } = await supabase
        .from("agent_wallets")
        .select("wallet_address, wallet_id")
        .eq("agent_id", agentId)
        .maybeSingle();

      agentWalletAddress = dbRecord?.wallet_address;

      if (!agentWalletAddress) {
        console.log(
          `[Circle] Wallet not found. Provisioning clean instance on ARC-TESTNET...`,
        );

        const walletResponse = await circleClient.createWallets({
          walletSetId: walletSetId,
          blockchains: ["ARC-TESTNET"],
          count: 1,
        });

        const newAgentWallet = walletResponse.data?.wallets?.[0];
        if (!newAgentWallet)
          throw new Error("Failed to provision wallet structure from Circle.");

        agentWalletAddress = newAgentWallet.address;
        const agentWalletId = newAgentWallet.id;

        await supabase.from("agent_wallets").insert([
          {
            agent_id: agentId,
            wallet_address: agentWalletAddress,
            wallet_id: agentWalletId,
          },
        ]);

        console.log(`[Circle] New wallet provisioned: ${agentWalletAddress}`);
      }
    }

    // ─── STEP 3: Run the AI ───
    const { text: agentOutput } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system,
      prompt: userInput,
    });

    // ─── STEP 4: Settle escrow on-chain ───
    // The escrow contract releases 100% to whichever wallet was registered
    // as workerAgentWallet in createJob (set from /api/prepare-job)
    const txHash = await relayerClient.writeContract({
      address: contractAddress,
      abi: AGENTIX_ESCROW_ABI,
      functionName: "releaseJob",
      args: [jobId],
    });

    const receipt = await relayerClient.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log("Transaction Logs:", receipt.logs);

    if (receipt.status === "success") {
      await supabase
        .from("user_jobs")
        .update({ status: "success", ai_output: agentOutput, tx_hash: txHash })
        .eq("job_id", jobId);

      // Award points to user
      const POINTS_PER_JOB = 10;
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("points")
        .eq("wallet_address", cleanWalletAddress)
        .maybeSingle();

      const currentPoints = existingProfile?.points || 0;
      await supabase.from("user_profiles").upsert(
        {
          wallet_address: cleanWalletAddress,
          points: currentPoints + POINTS_PER_JOB,
        },
        { onConflict: "wallet_address" },
      );

      console.log(
        `[Points] Awarded ${POINTS_PER_JOB} pts to ${cleanWalletAddress}. New total: ${currentPoints + POINTS_PER_JOB}`,
      );

      // ─── STEP 5: For third-party agents, log the platform fee split ───
      // Note: The actual on-chain split (95/5) requires a Solidity contract change.
      // For now the full amount goes to the developer wallet via escrow.
      // Log it for your records — you can implement contract-level splitting later.
      if (isThirdPartyAgent && thirdPartyDeveloperWallet) {
        const priceNum = parseFloat(price || "0");
        const platformCut = (priceNum * PLATFORM_FEE_BPS) / 10000;
        const developerCut = priceNum - platformCut;
        console.log(
          `[Revenue Split] Agent: ${agentId} | Developer gets: ${developerCut.toFixed(4)} USDC | Platform fee: ${platformCut.toFixed(4)} USDC`,
        );
        // TODO: When you update your Solidity contract to support split payments,
        // the releaseJob function will handle this automatically on-chain.
      }
    } else {
      throw new Error("Transaction reverted on-chain.");
    }

    return NextResponse.json({
      success: true,
      agentWalletAddress,
      agentOutput,
      payoutTxHash: txHash,
    });
  } catch (error: any) {
    console.error("Backend Gateway Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}
