import { fetchThingSpeakFeeds } from "@/lib/thingspeak";

export async function GET() {
  try {
    const data = await fetchThingSpeakFeeds();
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Data sensor tidak tersedia saat ini.";
    return Response.json({ error: message }, { status: 500 });
  }
}
