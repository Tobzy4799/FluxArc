import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { agentId, action } = await req.json();
  // action: 'approve' | 'reject' | 'deactivate' | 'reactivate'

  const statusMap: Record<string, string> = {
    approve: "live",
    reject: "rejected",
    deactivate: "suspended",
    reactivate: "live",
  };

  const status = statusMap[action];
  if (!status) {
    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  }

  const { error } = await supabase
    .from("registered_agents")
    .update({ status })
    .eq("id", agentId);

  if (error) return NextResponse.json({ success: false }, { status: 500 });
  return NextResponse.json({ success: true });
}