import { useState, useEffect } from "react";

export const TEXT_PRESETS = {
  standard: { charset: "@%#*+=-:.", font: "system-ui, sans-serif" },
  blocks: { charset: "█▓▒░ ", font: "system-ui, sans-serif" },
  binary: { charset: "01", font: "system-ui, sans-serif" },
  manual: { charset: "0 ", font: "system-ui, sans-serif" },
  hex: { charset: "0123456789ABCDEF", font: "system-ui, sans-serif" },
  detailed: {
    charset: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'.",
    font: "system-ui, sans-serif",
  },
};

export const EFFECT_PRESETS = {
  "Low → High": {
    brightnessStart: 0,
    brightnessEnd: 100,
    contrastStart: 0,
    contrastEnd: 100,
    colorMode: "color",
    frames: 12,
  },
  "Medium → High": {
    brightnessStart: 20,
    brightnessEnd: 30,
    contrastStart: 40,
    contrastEnd: 50,
    colorMode: "color",
    frames: 12,
  },
  "Static Mid": {
    brightnessStart: 50,
    brightnessEnd: 50,
    contrastStart: 40,
    contrastEnd: 50,
    colorMode: "color",
    frames: 12,
  },
};

export const DEFAULT_CONFIG = {
  charset: TEXT_PRESETS.detailed.charset,
  contrastStart: 40,
  contrastEnd: 50,
  brightnessStart: 20,
  brightnessEnd: 30,
  colorMode: "color" as "color" | "grayscale",
  font: "system-ui, sans-serif",
  frames: 12,
};

export function useAsciiConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const saved = localStorage.getItem("asciiConfig");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        console.warn("[AsciiConfig] Failed to parse saved config");
      }
    }
  }, []);

  const validateCharset = (charset: string) => {
    for (const char of charset) {
      if (char.length !== 1 || char.codePointAt(0)! > 127) return false;
    }
    return true;
  };

  const resetConfig = () => setConfig(DEFAULT_CONFIG);

  return { config, setConfig, validateCharset, resetConfig };
}
