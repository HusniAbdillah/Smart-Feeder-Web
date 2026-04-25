import { FilterRange } from "@/types";

export function formatTimestamp(timestamp: string, range: FilterRange): string {
  try {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Jakarta",
    };

    if (range === "1h") {
      options.hour = "2-digit";
      options.minute = "2-digit";
    } else if (range === "1d") {
      options.hour = "2-digit";
      options.minute = "2-digit";
    } else if (range === "1w" || range === "1m") {
      options.day = "numeric";
      options.month = "short";
      options.hour = "2-digit";
      options.minute = "2-digit";
    } else {
      options.day = "numeric";
      options.month = "short";
      options.year = "2-digit";
    }

    return new Intl.DateTimeFormat("id-ID", options).format(date);
  } catch {
    return timestamp;
  }
}
