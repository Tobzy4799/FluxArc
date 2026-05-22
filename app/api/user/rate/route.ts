import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { job_id, rating, review_comment } = await req.json();

  const { error } = await supabase
    .from("user_jobs")
    .update({
      rating: rating,
      review_comment: review_comment, // Make sure this matches your DB column name
    })
    .eq("job_id", job_id);

  if (error) return NextResponse.json({ success: false }, { status: 500 });
  return NextResponse.json({ success: true });
}
