import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ImageInput from "./components/ImageInput";
import { useImageInput } from "./hooks/useImageInput";
import AsciiConfigPanel from "./components/AsciiConfigPanel";
import { DEFAULT_CONFIG } from "./hooks/useAsciiConfig";

export default function App() {
  const { imageState, handleImageLoad, clearImage } = useImageInput();
  const [asciiConfig, setAsciiConfig] = useState(DEFAULT_CONFIG);
  const workerRef = useRef<Worker | null>(null);

  // initialize worker for config validation
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./workers/asciiConfigWorker.ts", import.meta.url),
      { type: "module" }
    );

    const w = workerRef.current;
    w.onmessage = (e) => {
      if (e.data.success) {
        console.log("[app] valid config ready:", e.data.config);
      } else {
        console.error("[app] config validation failed:", e.data.error);
      }
    };

    return () => {
      w.terminate();
    };
  }, []);

  // handle config changes from asciiconfigpanel
  const handleConfigChange = (config: typeof DEFAULT_CONFIG) => {
    setAsciiConfig(config);
    workerRef.current?.postMessage(config);
  };

  // handle image load
  const handleDebugLoad = (bitmap: ImageBitmap, file: File | null, previewUrl: string) => {
    handleImageLoad(bitmap, file, previewUrl);
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

      {/* debug output - commented out */}
      {/*
      <div className="w-full max-w-3xl mt-8">
        <pre className="text-xs bg-gray-900/60 border border-gray-800 rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(
            {
              image: imageState.previewUrl
                ? {
                    width: imageState.width,
                    height: imageState.height,
                    file: imageState.file?.name,
                  }
                : null,
              config: asciiConfig,
            },
            null,
            2
          )}
        </pre>
      </div>
      */}
    </div>
  );
}