import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ImageInput from "./components/ImageInput";
import { useImageInput } from "./hooks/useImageInput";
import AsciiConfigPanel from "./components/AsciiConfigPanel";
import { DEFAULT_CONFIG } from "./hooks/useAsciiConfig";
import type { AsciiConfig } from "./workers/asciiConfigWorker";
import type { AsciiFrame } from "./workers/AsciiWorker";

export default function App() {
  const { imageState, handleImageLoad, clearImage } = useImageInput();
  const [asciiConfig, setAsciiConfig] = useState(DEFAULT_CONFIG);
  const [asciiFrame, setAsciiFrame] = useState<AsciiFrame | null>(null);
  const [progress, setProgress] = useState(0);

  const configWorkerRef = useRef<Worker | null>(null);
  const asciiWorkerRef = useRef<Worker | null>(null);

  // initialize config worker
  useEffect(() => {
    configWorkerRef.current = new Worker(
      new URL("./workers/asciiConfigWorker.ts", import.meta.url),
      { type: "module" }
    );

    const w = configWorkerRef.current;
    w.onmessage = (e) => {
      if (!e.data.success) return console.error("[App] Config validation failed:", e.data.error);
      console.log("[App] Config validated:", e.data.config);

      // post image + validated config to asciiWorker
      if (imageState.bitmap) {
        asciiWorkerRef.current?.postMessage({
          type: "process",
          imageBitmap: imageState.bitmap,
          config: {
            cols: 80,
            rows: 40,
            charset: e.data.config.charset,
            contrast: e.data.config.contrastEnd,
            brightness: e.data.config.brightnessEnd,
            gamma: 1,
            colorsEnabled: e.data.config.colorMode,
          },
          frameIndex: 0,
        });
      }
    };

    return () => {
      w.terminate();
    };
  }, [imageState.bitmap]);

  // initialize ascii worker
  useEffect(() => {
    asciiWorkerRef.current = new Worker(
      new URL("./workers/AsciiWorker.ts", import.meta.url),
      { type: "module" }
    );

    const w = asciiWorkerRef.current;
    w.onmessage = (e) => {
      if (e.data.type === "progress") {
        setProgress(e.data.value);
      } else if ("text" in e.data) {
        setAsciiFrame(e.data);
      } else if (e.data.type === "error") {
        console.error("[AsciiWorker] error:", e.data.message);
      }
    };

    return () => {
      w.terminate();
    };
  }, []);

  // handle config changes
  const handleConfigChange = (config: typeof DEFAULT_CONFIG) => {
    setAsciiConfig(config);
    configWorkerRef.current?.postMessage(config);
  };

  // handle image load
  const handleDebugLoad = (bitmap: ImageBitmap, file: File | null, previewUrl: string) => {
    handleImageLoad(bitmap, file, previewUrl);

    // re-run ASCII worker if config already validated
    configWorkerRef.current?.postMessage(asciiConfig);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-start gap-8 p-6">
      <h1 className="text-xl font-semibold mb-2">image input + ascii config</h1>

      {/* ascii config panel */}
      <div className="w-full max-w-3xl bg-gray-900/40 border border-gray-800 rounded-xl p-6 shadow-lg">
        <AsciiConfigPanel onConfigChange={handleConfigChange} />
      </div>

      {/* image input */}
      <div className="w-full max-w-2xl">
        {!imageState.previewUrl ? (
          <ImageInput onImageLoad={handleDebugLoad} />
        ) : (
          <div className="relative flex flex-col items-center">
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition"
              aria-label="clear image"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <img
              src={imageState.previewUrl}
              alt="preview"
              className="max-w-xs rounded-lg border border-gray-700"
            />

            <div className="mt-2 text-sm text-gray-400 text-center">
              {imageState.width}×{imageState.height}px
              {imageState.file && (
                <span className="block text-xs text-gray-500 mt-1">
                  {imageState.file.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ascii preview */}
      {asciiFrame && (
        <div className="w-full max-w-3xl mt-6">
          <div className="text-sm text-gray-400 mb-1">progress: {(progress * 100).toFixed(0)}%</div>
          <pre style={{ lineHeight: 0.6, fontFamily: asciiConfig.font }}>
            {asciiFrame.text.map((row, i) => (
              <span key={i}>
                {row.map((char, j) =>
                  asciiFrame.colors ? (
                    <span key={j} style={{ color: asciiFrame.colors[i][j] }}>
                      {char}
                    </span>
                  ) : (
                    char
                  )
                )}
                {"\n"}
              </span>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}