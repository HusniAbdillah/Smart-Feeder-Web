import { NextRequest, NextResponse } from "next/server";
import { fetchThingSpeakFeeds } from "@/lib/thingspeak";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const range = searchParams.get("range") || "1h";

  try {
    const data = await fetchThingSpeakFeeds(range);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
