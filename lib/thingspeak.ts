import { cacheLife, cacheTag } from "next/cache";
import type {
  ThingSpeakResponse,
  ThingSpeakFeed,
  SmartFeederSensorData,
  ApiDataResponse,
} from "@/types";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

function getRangeWindow(range: string, latestTimestamp: string): { start: string; end: string } {
  const endDate = new Date(latestTimestamp);
  const startDate = new Date(endDate.getTime());

  if (range === "1d") {
    startDate.setDate(startDate.getDate() - 1);
  } else if (range === "1w") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "1m") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "all") {
    startDate.setTime(0);
  } else {
    startDate.setTime(endDate.getTime() - ONE_HOUR_MS);
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

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
    const lastUrl = `https://api.thingspeak.com/channels/${channelId}/feeds/last.json?api_key=${apiKey}`;
    const lastRes = await fetch(lastUrl);

    if (!lastRes.ok) {
      return emptyResponse();
    }

    const latestRaw = (await lastRes.json()) as ThingSpeakFeed;
    if (!latestRaw.created_at) {
      return emptyResponse();
    }

    const latest = parseFeed(latestRaw);
    const { start, end } = getRangeWindow(range, latest.timestamp);

    const historyUrl = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(historyUrl);

    if (!res.ok) {
      return { latest, history: [latest], fetchedAt: new Date().toISOString() };
    }

    const raw = (await res.json()) as ThingSpeakResponse;

    const feeds = raw.feeds ?? [];
    const history = feeds.length > 0 ? feeds.map(parseFeed) : [latest];

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
