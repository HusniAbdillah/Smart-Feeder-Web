import { cacheLife, cacheTag } from "next/cache";
import type {
  ThingSpeakResponse,
  ThingSpeakFeed,
  SmartFeederSensorData,
  ApiDataResponse,
} from "@/types";

function parseFeed(feed: ThingSpeakFeed): SmartFeederSensorData {
  return {
    surfaceTemp: parseFloat(feed.field1 ?? "0") || 0,
    midTemp: parseFloat(feed.field2 ?? "0") || 0,
    bottomTemp: parseFloat(feed.field3 ?? "0") || 0,
    dissolvedOxygen: parseFloat(feed.field4 ?? "0") || 0,
    ph: parseFloat(feed.field5 ?? "0") || 0,
    depth: (parseFloat(feed.field6 ?? "0") || 0) / 100,
    timestamp: feed.created_at,
  };
}

const FALLBACK: SmartFeederSensorData = {
  surfaceTemp: 0,
  midTemp: 0,
  bottomTemp: 0,
  dissolvedOxygen: 0,
  ph: 0,
  depth: 0,
  timestamp: new Date(0).toISOString(),
};

function emptyResponse(): ApiDataResponse {
  return { latest: FALLBACK, history: [], fetchedAt: new Date().toISOString() };
}

export async function fetchThingSpeakFeeds(): Promise<ApiDataResponse> {
  "use cache";
  cacheLife({ stale: 0, revalidate: 20, expire: 120 });
  cacheTag("thingspeak-data");

  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId || !apiKey) {
    return emptyResponse();
  }

  try {
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=20`;

    const res = await fetch(url);

    if (!res.ok) {
      return emptyResponse();
    }

    const raw = (await res.json()) as ThingSpeakResponse;

    const feeds = raw.feeds ?? [];
    const history = feeds.map(parseFeed);
    const latest = history.at(-1) ?? FALLBACK;

    return { latest, history, fetchedAt: new Date().toISOString() };
  } catch {
    return emptyResponse();
  }
}
