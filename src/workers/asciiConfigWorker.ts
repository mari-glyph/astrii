// asciiConfigWorker validates and prepares ASCII config before dispatching heavy image ops.

self.addEventListener("message", (e) => {
  const config = e.data;

  // basic schema validation
  const requiredKeys = ["charset", "contrastStart", "contrastEnd", "brightnessStart", "brightnessEnd", "colorMode", "font", "frames"];
  const valid = requiredKeys.every((k) => k in config);

  if (!valid) {
    self.postMessage({ success: false, error: "Invalid config schema." });
    return;
  }

  // simulate preprocessing
  console.log("[asciiConfigWorker] Validated config:", config);

  // post validated config back
  self.postMessage({ success: true, config });
});