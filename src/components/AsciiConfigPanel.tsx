import { useState, useEffect } from "react";

// types
export type ColorMode = "color" | "grayscale";

export type TextPreset = "standard" | "blocks" | "binary" | "manual" | "hex" | "detailed";

export type AsciiConfig = {
  charset: string;
  contrastStart: number;
  contrastEnd: number;
  brightnessStart: number;
  brightnessEnd: number;
  colorMode: ColorMode;
  font: string;
  frames: number;
  textPreset: TextPreset;
};

export const DEFAULT_CONFIG: AsciiConfig = {
  charset: "@%#*+=-:.",
  contrastStart: -30,
  contrastEnd: 70,
  brightnessStart: -10,
  brightnessEnd: 10,
  colorMode: "color",
  font: "system-ui",
  frames: 12,
  textPreset: "standard",
};

interface AsciiConfigPanelProps {
  config?: AsciiConfig;
  onConfigChange: (config: AsciiConfig) => void;
}

export default function AsciiConfigPanel({
  config = DEFAULT_CONFIG,
  onConfigChange,
}: AsciiConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<AsciiConfig>(config);

  // sync prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // helper to update config and notify parent
  const handleChange = <K extends keyof AsciiConfig>(key: K, value: AsciiConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* text preset */}
      <label className="flex flex-col gap-1 text-sm text-gray-300">
        text preset
        <select
          value={localConfig.textPreset}
          onChange={(e) => handleChange("textPreset", e.target.value as TextPreset)}
          className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
        >
          <option value="standard">standard</option>
          <option value="blocks">blocks</option>
          <option value="binary">binary</option>
          <option value="manual">manual</option>
          <option value="hex">hex</option>
          <option value="detailed">detailed</option>
        </select>
      </label>

      {/* charset input */}
      {localConfig.textPreset === "manual" && (
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          manual charset
          <input
            type="text"
            value={localConfig.charset}
            onChange={(e) => handleChange("charset", e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
          />
        </label>
      )}

      {/* font select */}
      <label className="flex flex-col gap-1 text-sm text-gray-300">
        font
        <select
          value={localConfig.font}
          onChange={(e) => handleChange("font", e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
        >
          <option value="system-ui">system-ui</option>
          <option value="sans-serif">sans-serif</option>
          <option value="monospace">monospace</option>
          <option value="jetbrains mono">jetbrains mono</option>
        </select>
      </label>

      {/* color mode */}
      <label className="flex flex-col gap-1 text-sm text-gray-300">
        color mode
        <select
          value={localConfig.colorMode}
          onChange={(e) => handleChange("colorMode", e.target.value as ColorMode)}
          className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
        >
          <option value="color">color</option>
          <option value="grayscale">grayscale</option>
        </select>
      </label>

      {/* contrast sliders */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-300">
          contrast start: {localConfig.contrastStart}
          <input
            type="range"
            min={-100}
            max={100}
            value={localConfig.contrastStart}
            onChange={(e) => handleChange("contrastStart", parseInt(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-sm text-gray-300">
          contrast end: {localConfig.contrastEnd}
          <input
            type="range"
            min={-100}
            max={100}
            value={localConfig.contrastEnd}
            onChange={(e) => handleChange("contrastEnd", parseInt(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      {/* brightness sliders */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-300">
          brightness start: {localConfig.brightnessStart}
          <input
            type="range"
            min={-100}
            max={100}
            value={localConfig.brightnessStart}
            onChange={(e) => handleChange("brightnessStart", parseInt(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-sm text-gray-300">
          brightness end: {localConfig.brightnessEnd}
          <input
            type="range"
            min={-100}
            max={100}
            value={localConfig.brightnessEnd}
            onChange={(e) => handleChange("brightnessEnd", parseInt(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      {/* frame count */}
      <label className="flex flex-col gap-1 text-sm text-gray-300">
        frames
        <input
          type="number"
          min={1}
          max={120}
          value={localConfig.frames}
          onChange={(e) => handleChange("frames", parseInt(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
        />
      </label>
    </div>
  );
}
