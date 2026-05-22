import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("registered_agents")
    .select("*")
    .eq("status", "live")
    .eq("listing_fee_paid", true);

  if (error) return NextResponse.json({ success: false }, { status: 500 });
  return NextResponse.json({ success: true, agents: data || [] });
}
