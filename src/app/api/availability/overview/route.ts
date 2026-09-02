import { NextRequest, NextResponse } from "next/server";
import { getAvailabilityOverview } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const daysParam = searchParams.get("days");
  const durationParam = searchParams.get("duration");

  const days = daysParam ? parseInt(daysParam, 10) : 14;
  if (isNaN(days) || days < 1 || days > 60) {
    return NextResponse.json(
      { error: "Invalid days parameter." },
      { status: 400 }
    );
  }

  const duration = durationParam ? parseInt(durationParam, 10) : undefined;

  try {
    const overview = await getAvailabilityOverview(days, duration);
    return NextResponse.json({ days: overview });
  } catch (error) {
    console.error("Availability overview error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}