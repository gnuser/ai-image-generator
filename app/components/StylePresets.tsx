"use client";

import { useState } from "react";

interface StylePresetsProps {
  setCurrentStyle: (style: string) => void;
}

// Predefined style presets for consistent image generation
const STYLE_PRESETS = [
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, flowing watercolor painting style",
    prompt:
      "in the style of watercolor painting, soft colors, flowing, artistic",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic cyberpunk aesthetic with neon lights",
    prompt:
      "cyberpunk style, neon lights, futuristic, high contrast, digital art",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Retro vintage look from the 1970s",
    prompt: "vintage 1970s style, retro, film grain, faded colors, nostalgic",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Japanese anime illustration style",
    prompt: "anime style, manga illustration, vibrant, clean lines, detailed",
  },
  {
    id: "oil-painting",
    name: "Oil Painting",
    description: "Classical oil painting with rich textures",
    prompt:
      "oil painting style, rich textures, classical, detailed brushstrokes, artistic",
  },
  {
    id: "custom",
    name: "Custom Style",
    description: "Define your own custom style",
    prompt: "",
  },
];

export default function StylePresets({ setCurrentStyle }: StylePresetsProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState("");

  const handleStyleSelect = (styleId: string, stylePrompt: string) => {
    setSelectedStyle(styleId);

    if (styleId === "custom") {
      setCurrentStyle(customStyle);
    } else {
      setCurrentStyle(stylePrompt);
    }
  };

  const handleCustomStyleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCustomStyle(e.target.value);
    if (selectedStyle === "custom") {
      setCurrentStyle(e.target.value);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-black">Style Presets</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select a style preset to ensure consistent image generation
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              className={`btn btn-outline ${
                selectedStyle === style.id ? "btn-primary" : ""
              }`}
              onClick={() => handleStyleSelect(style.id, style.prompt)}
            >
              {style.name}
            </button>
          ))}
        </div>

        {selectedStyle === "custom" && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Custom Style Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-20"
              placeholder="Describe your custom style here..."
              value={customStyle}
              onChange={handleCustomStyleChange}
            />
          </div>
        )}

        {selectedStyle && selectedStyle !== "custom" && (
          <div className="bg-base-200 p-3 rounded-lg mt-2 text-black">
            <p className="text-sm font-medium mb-1">
              {STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              {STYLE_PRESETS.find((s) => s.id === selectedStyle)?.description}
            </p>
            <p className="text-xs italic">
              "{STYLE_PRESETS.find((s) => s.id === selectedStyle)?.prompt}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
