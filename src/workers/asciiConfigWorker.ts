// src/workers/asciiConfigWorker.ts
export interface AsciiConfig {
  charset: string;
  contrastStart: number;
  contrastEnd: number;
  brightnessStart: number;
  brightnessEnd: number;
  colorMode: boolean;
  font: string;
  frames: number;
}

self.addEventListener("message", (e: MessageEvent<AsciiConfig>) => {
  const config = e.data;

  // validate schema
  const requiredKeys = [
    "charset",
    "contrastStart",
    "contrastEnd",
    "brightnessStart",
    "brightnessEnd",
    "colorMode",
    "font",
    "frames",
  ];
  const valid = requiredKeys.every((k) => k in config);

  if (!valid) {
    self.postMessage({ success: false, error: "Invalid config schema." });
    return;
  }

  // preprocessing/interpolation
  const processedConfig = {
    ...config,
    contrastStart: config.contrastStart ?? 0,
    contrastEnd: config.contrastEnd ?? 0,
    brightnessStart: config.brightnessStart ?? 0,
    brightnessEnd: config.brightnessEnd ?? 0,
    colorMode: config.colorMode ?? false,
  };

  console.log("[asciiConfigWorker] Validated config:", processedConfig);

  // post validated config
  self.postMessage({ success: true, config: processedConfig });
});
