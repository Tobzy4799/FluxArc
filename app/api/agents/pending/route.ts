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
    .in("status", ["pending", "live", "suspended"]) // all manageable statuses
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false }, { status: 500 });
  return NextResponse.json({ success: true, agents: data || [] });
}