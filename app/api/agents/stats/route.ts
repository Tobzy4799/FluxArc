import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  try {
    const { data: jobs, error } = await supabase
      .from("user_jobs")
      .select("agent_id, rating, review_comment, status, created_at");
    if (error) throw error;

    // Hardcoded balances as per your requirement
    const balances = {
      "social-manager": "0.10",
      "youtube-optimizer": "0.25",
      "global-localizer": "0.15",
      "solidity-auditor": "0.50",
      "web-scraper": "0.20",
    };

    const stats: Record<string, { tasks24h: number; avgRating: number }> = {};

    jobs?.forEach((job) => {
      if (!stats[job.agent_id]) {
        stats[job.agent_id] = { tasks24h: 0, avgRating: 0 };
      }

      // Accumulate temporary fields for average calculation
      const temp = stats[job.agent_id] as any;
      if (!temp.sumRatings) temp.sumRatings = 0;
      if (!temp.countRatings) temp.countRatings = 0;

      // Logic for 24h demand
      if (
        job.status === "success" &&
        new Date(job.created_at) > new Date(Date.now() - 86400000)
      ) {
        stats[job.agent_id].tasks24h += 1;
      }

      // Logic for Rating
      if (job.rating) {
        temp.sumRatings += job.rating;
        temp.countRatings += 1;
        stats[job.agent_id].avgRating = Number(
          (temp.sumRatings / temp.countRatings).toFixed(1),
        );
      }
    });

    return NextResponse.json({ success: true, stats, balances });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
