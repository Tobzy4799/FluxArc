import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address parameter is required." },
        { status: 400 },
      );
    }

    console.log(`[API] Fetching history rows for wallet: ${walletAddress}`);

    const { data: jobs, error } = await supabase
      .from("user_jobs")
      .select("*")
      .eq("user_wallet", walletAddress)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error("[API History Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
