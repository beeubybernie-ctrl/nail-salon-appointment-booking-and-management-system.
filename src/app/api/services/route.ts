import { NextResponse } from "next/server";
import { getServiceCatalog } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getServiceCatalog();
  return NextResponse.json({ categories: catalog });
}