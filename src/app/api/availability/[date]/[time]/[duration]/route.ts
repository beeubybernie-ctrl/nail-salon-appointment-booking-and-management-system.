import { NextResponse } from "next/server";
import { isSlotAvailable } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string; time: string; duration: string }> }
) {
  const { date, time, duration } = await params;

  const endMinOffset = parseInt(duration, 10);
  if (isNaN(endMinOffset) || endMinOffset <= 0) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 422 });
  }

  const [h, m] = time.split(":").map(Number);
  const endTotal = h * 60 + m + endMinOffset;
  const endTime = `${Math.floor(endTotal / 60)
    .toString()
    .padStart(2, "0")}:${(endTotal % 60).toString().padStart(2, "0")}`;

  try {
    const result = await isSlotAvailable(date, time, endTime);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Slot availability error:", error);
    return NextResponse.json(
      { valid: false, reason: "Could not check availability." },
      { status: 500 }
    );
  }
}