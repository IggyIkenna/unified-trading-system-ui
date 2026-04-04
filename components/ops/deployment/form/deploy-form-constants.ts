export const REGIONS = [
  { value: "asia-northeast1", label: "asia-northeast1 (Tokyo)" },
  { value: "asia-northeast2", label: "asia-northeast2 (Osaka)" },
  { value: "asia-southeast1", label: "asia-southeast1 (Singapore)" },
  { value: "us-central1", label: "us-central1 (Iowa)" },
  { value: "us-east1", label: "us-east1 (South Carolina)" },
  { value: "us-west1", label: "us-west1 (Oregon)" },
  { value: "europe-west1", label: "europe-west1 (Belgium)" },
  { value: "europe-west2", label: "europe-west2 (London)" },
];

export const getZonesForRegion = (region: string) => [
  { value: `${region}-a`, label: `${region}-a` },
  { value: `${region}-b`, label: `${region}-b` },
  { value: `${region}-c`, label: `${region}-c` },
];
