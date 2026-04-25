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

export async function fetchThingSpeakFeeds(range: string = "1h"): Promise<ApiDataResponse> {
  "use cache";
  cacheLife({ stale: 0, revalidate: 20, expire: 120 });
  cacheTag(`thingspeak-data-${range}`);

  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId || !apiKey) {
    return emptyResponse();
  }

  try {
    let timeParam = "minutes=60"; // default 1h
    if (range === "1d") timeParam = "days=1";
    else if (range === "1w") timeParam = "days=7";
    else if (range === "1m") timeParam = "days=30";
    else if (range === "all") timeParam = "results=8000";
    else if (range === "1h") timeParam = "minutes=60";

    // For trends, we need at least 1 hour of data.
    // If range is e.g. "1h", it naturally includes the last hour.
    // If it's something else, it will have more data.
    
    // We always want to calculate 1-hour trend, so if range is too small (e.g. we only fetch last 5 mins),
    // we wouldn't have 1 hour ago data. But we don't have smaller ranges than 1h.
    
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&${timeParam}`;

    const res = await fetch(url);

    if (!res.ok) {
      return emptyResponse();
    }

    const raw = (await res.json()) as ThingSpeakResponse;

    const feeds = raw.feeds ?? [];
    const history = feeds.map(parseFeed);
    const latest = history.at(-1) ?? FALLBACK;

    // Calculate trends (vs 1 hour ago)
    let trends: Partial<Record<keyof SmartFeederSensorData, number>> | undefined = undefined;
    
    if (history.length > 1) {
      const oneHourAgoTime = new Date(latest.timestamp).getTime() - 60 * 60 * 1000;
      let closest = history[0];
      let minDiff = Infinity;
      
      for (const item of history) {
        const diff = Math.abs(new Date(item.timestamp).getTime() - oneHourAgoTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = item;
        }
      }
      
      // Calculate diff only if we found a point within 2 hours of target
      if (closest && minDiff <= 2 * 60 * 60 * 1000) {
        trends = {
          surfaceTemp: latest.surfaceTemp - closest.surfaceTemp,
          midTemp: latest.midTemp - closest.midTemp,
          bottomTemp: latest.bottomTemp - closest.bottomTemp,
          dissolvedOxygen: latest.dissolvedOxygen - closest.dissolvedOxygen,
          ph: latest.ph - closest.ph,
          depth: latest.depth - closest.depth,
        };
      }
    }

    return { latest, history, trends, fetchedAt: new Date().toISOString() };
  } catch {
    return emptyResponse();
  }
}
