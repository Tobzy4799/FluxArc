import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const body = await req.json();
  const {
    name,
    description,
    placeholder,
    price,
    prompt,
    developer_wallet,
    developer_email,
    tx_hash,
  } = body;

  if (
    !name ||
    !description ||
    !placeholder ||
    !price ||
    !prompt ||
    !developer_wallet ||
    !tx_hash
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Generate a clean ID from the name
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);

  // Check if ID already exists
  const { data: existing } = await supabase
    .from("registered_agents")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: "An agent with this name already exists." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("registered_agents").insert([
    {
      id,
      name,
      description,
      placeholder,
      price,
      prompt,
      developer_wallet: developer_wallet.toLowerCase(),
      developer_email,
      listing_fee_paid: true, // verified by tx_hash presence
      status: "pending", // you approve in admin
    },
  ]);

  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  return NextResponse.json({ success: true, agentId: id });
}
