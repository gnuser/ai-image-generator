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
    id: "three-kingdoms",
    name: "三国人物",
    description:
      "Traditional Chinese painting style depicting Three Kingdoms characters",
    prompt:
      "traditional Chinese ink painting style, Three Kingdoms era characters, historical Chinese warriors, dramatic poses, ornate armor, ancient Chinese aesthetic",
  },
  {
    id: "kids-illustration",
    name: "Kids' Illustration",
    description: "Colorful, friendly style perfect for children aged 6-10",
    prompt:
      "children's book illustration style, bright cheerful colors, simplified details, educational, friendly characters with expressive faces, slightly stylized proportions, clear outlines, engaging composition, age-appropriate for elementary school children, playful but informative",
  },
  {
    id: "custom",
    name: "Custom Style",
    description: "Define your own custom style",
    prompt: "",
  },
];

export default function StylePresets({ setCurrentStyle }: StylePresetsProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState("");

  const handleStyleSelect = (styleId: string, stylePrompt: string) => {
    // If custom style is selected, handle it separately
    if (styleId === "custom") {
      setSelectedStyles(["custom"]);
      setCurrentStyle(customStyle);
      return;
    }

    // If the style is already selected, remove it
    if (selectedStyles.includes(styleId)) {
      const newSelectedStyles = selectedStyles.filter((s) => s !== styleId);
      setSelectedStyles(newSelectedStyles);

      if (newSelectedStyles.length === 0) {
        // No styles selected
        setCurrentStyle("");
      } else if (newSelectedStyles.length === 1) {
        // Only one style selected
        const singleStyle = newSelectedStyles[0];
        if (singleStyle === "custom") {
          setCurrentStyle(customStyle);
        } else {
          const styleObj = STYLE_PRESETS.find((s) => s.id === singleStyle);
          setCurrentStyle(styleObj?.prompt || "");
        }
      }
      return;
    }

    // If we already have 2 styles and trying to add another, replace the second one
    let newSelectedStyles;
    if (selectedStyles.length >= 2) {
      newSelectedStyles = [selectedStyles[0], styleId];
    } else {
      // Add the new style
      newSelectedStyles = [...selectedStyles, styleId];
    }

    setSelectedStyles(newSelectedStyles);

    // If only one style is selected, use it directly
    if (newSelectedStyles.length === 1) {
      setCurrentStyle(stylePrompt);
    } else if (newSelectedStyles.length === 2) {
      // Automatically merge the styles when two are selected
      const style1 =
        newSelectedStyles[0] === "custom"
          ? customStyle
          : STYLE_PRESETS.find((s) => s.id === newSelectedStyles[0])?.prompt ||
            "";

      const style2 =
        newSelectedStyles[1] === "custom"
          ? customStyle
          : STYLE_PRESETS.find((s) => s.id === newSelectedStyles[1])?.prompt ||
            "";

      setCurrentStyle(`${style1}, combined with ${style2}`);
    }
  };

  const handleCustomStyleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newCustomStyle = e.target.value;
    setCustomStyle(newCustomStyle);

    if (selectedStyles.includes("custom")) {
      // If we have custom style selected along with another style
      if (selectedStyles.length === 2) {
        const otherStyleIndex = selectedStyles[0] === "custom" ? 1 : 0;
        const otherStyleId = selectedStyles[otherStyleIndex];
        const otherStyle =
          STYLE_PRESETS.find((s) => s.id === otherStyleId)?.prompt || "";

        if (selectedStyles[0] === "custom") {
          setCurrentStyle(`${newCustomStyle}, combined with ${otherStyle}`);
        } else {
          setCurrentStyle(`${otherStyle}, combined with ${newCustomStyle}`);
        }
      } else {
        // Just custom style alone
        setCurrentStyle(newCustomStyle);
      }
    }
  };

  const getMergedStylePrompt = () => {
    if (selectedStyles.length !== 2) return "";

    const style1 =
      selectedStyles[0] === "custom"
        ? customStyle
        : STYLE_PRESETS.find((s) => s.id === selectedStyles[0])?.prompt || "";

    const style2 =
      selectedStyles[1] === "custom"
        ? customStyle
        : STYLE_PRESETS.find((s) => s.id === selectedStyles[1])?.prompt || "";

    return `${style1}, combined with ${style2}`;
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-black">Style Presets</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select up to two styles to apply or combine
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              className={`btn btn-outline ${
                selectedStyles.includes(style.id) ? "btn-primary" : ""
              }`}
              onClick={() => handleStyleSelect(style.id, style.prompt)}
            >
              {style.name}
            </button>
          ))}
        </div>

        {selectedStyles.includes("custom") && (
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

        {/* Display selected styles */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">
            Selected Styles ({selectedStyles.length}/2):
          </h3>
          <div className="space-y-2">
            {selectedStyles.map((styleId, index) => {
              const style = STYLE_PRESETS.find((s) => s.id === styleId);
              if (!style) return null;

              return (
                <div
                  key={index}
                  className="bg-base-200 p-3 rounded-lg text-black"
                >
                  <p className="text-sm font-medium mb-1">{style.name}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {style.description}
                  </p>
                  <p className="text-xs italic">
                    "{styleId === "custom" ? customStyle : style.prompt}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Display the merged style preview */}
        {selectedStyles.length === 2 && (
          <div className="bg-base-300 p-3 rounded-lg mt-4 text-black">
            <p className="text-sm font-medium mb-1">Merged Style:</p>
            <p className="text-xs italic">"{getMergedStylePrompt()}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
