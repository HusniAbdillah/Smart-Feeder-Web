export interface ThingSpeakChannel {
  id: number;
  name: string;
  description?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  field6?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
  field6: string | null;
}

export interface ThingSpeakResponse {
  channel: ThingSpeakChannel;
  feeds: ThingSpeakFeed[];
}

export interface SmartFeederSensorData {
  surfaceTemp: number;
  midTemp: number;
  bottomTemp: number;
  dissolvedOxygen: number;
  ph: number;
  depth: number;
  timestamp: string;
}

export type WQIStatus = "safe" | "warning" | "critical";

export interface WQIResult {
  score: number;
  status: WQIStatus;
  label: string;
  doScore: number;
  phScore: number;
  tempScore: number;
}

export interface ApiDataResponse {
  latest: SmartFeederSensorData;
  history: SmartFeederSensorData[];
  fetchedAt: string;
}
