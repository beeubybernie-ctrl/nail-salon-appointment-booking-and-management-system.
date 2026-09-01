import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "A valid date (YYYY-MM-DD) is required." },
      { status: 400 }
    );
  }

  const duration = durationParam ? parseInt(durationParam, 10) : undefined;
  try {
    const result = await getAvailableSlots(date, duration);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}