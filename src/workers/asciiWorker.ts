// src/workers/AsciiWorker.ts
import {
  clamp,
  luminance,
  applyContrastBrightness,
  mapToChar,
  scaleImage,
  rgbToHex,
} from "@/utils/RenderUtils";

export interface AsciiWorkerConfig {
  cols: number;
  rows: number;
  charset: string;
  contrast: number;
  brightness: number;
  gamma?: number;
  colorsEnabled?: boolean;
}

export interface AsciiFrame {
  index: number;
  text: string[][];
  colors?: string[][];
  timestamp: number;
}

interface WorkerMessage {
  type: "process";
  imageBitmap: ImageBitmap;
  config: AsciiWorkerConfig;
  frameIndex: number;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, imageBitmap, config, frameIndex } = event.data;

  if (type === "process") {
    const {
      cols,
      rows,
      charset,
      contrast,
      brightness,
      gamma = 1,
      colorsEnabled = false,
    } = config;

    try {
      const imgData = await scaleImage(imageBitmap, cols, rows);
      imageBitmap.close(); // free memory

      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      const frameText: string[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(" ")
      );
      const frameColors: string[][] = colorsEnabled
        ? Array.from({ length: rows }, () => Array(cols).fill("#000000"))
        : [];

      // single-pass pixel processing
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;
          const r = imgData.data[idx];
          const g = imgData.data[idx + 1];
          const b = imgData.data[idx + 2];

          let lum = luminance(r, g, b, gamma);
          lum = clamp(factor * (lum - 128) + 128 + brightness, 0, 255);

          frameText[y][x] = mapToChar(lum, charset);
          if (colorsEnabled) frameColors[y][x] = rgbToHex(r, g, b);
        }

        // post incremental progress
        if (y % Math.max(1, Math.floor(rows / 10)) === 0) {
          self.postMessage({ type: "progress", value: y / rows });
        }
      }

      // post final ASCII frame
      const frame: AsciiFrame = {
        index: frameIndex,
        text: frameText,
        colors: colorsEnabled ? frameColors : undefined,
        timestamp: performance.now(),
      };

      self.postMessage(frame);
    } catch (err) {
      self.postMessage({ type: "error", message: (err as Error).message });
    }
  }
};