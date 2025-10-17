//temp worker to test AsciiWorker :)
// src/hooks/useAsciiWorker.ts
import { useEffect, useRef, useState } from "react";
import type { AsciiFrame } from "@/workers/AsciiWorker";
import type { AsciiConfig } from "@/workers/asciiConfigWorker";

interface UseAsciiWorkerProps {
  imageBitmap: ImageBitmap | null;
  config: AsciiConfig;
}

export const useAsciiWorker = ({ imageBitmap, config }: UseAsciiWorkerProps) => {
  const [frame, setFrame] = useState<AsciiFrame | null>(null);
  const [progress, setProgress] = useState(0);
  const asciiWorkerRef = useRef<Worker | null>(null);
  const configWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!imageBitmap) return;

    // initialize workers
    asciiWorkerRef.current = new Worker(new URL("@/workers/AsciiWorker.ts", import.meta.url), { type: "module" });
    configWorkerRef.current = new Worker(new URL("@/workers/asciiConfigWorker.ts", import.meta.url), { type: "module" });

    const asciiWorker = asciiWorkerRef.current;
    const configWorker = configWorkerRef.current;

    // handle validated config
    configWorker.onmessage = (e) => {
      if (!e.data.success) return console.error(e.data.error);
      const validatedConfig = e.data.config;

      // send image + validated config to asciiWorker
      asciiWorker.postMessage({
        type: "process",
        imageBitmap,
        config: {
          cols: 80,
          rows: 40,
          charset: validatedConfig.charset,
          contrast: validatedConfig.contrastEnd,
          brightness: validatedConfig.brightnessEnd,
          gamma: 1,
          colorsEnabled: validatedConfig.colorMode,
        },
        frameIndex: 0,
      });
    };

    // handle ASCII worker messages
    asciiWorker.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.value);
      else if ("text" in e.data) setFrame(e.data);
      else if (e.data.type === "error") console.error("AsciiWorker error:", e.data.message);
    };

    // send config for validation
    configWorker.postMessage(config);

    return () => {
      asciiWorker.terminate();
      configWorker.terminate();
    };
  }, [imageBitmap, config]);

  return { frame, progress };
};
