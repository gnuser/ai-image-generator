"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

interface ImageGeneratorProps {
  currentStyle: string;
  addImage: (imageUrl: string) => void;
}

interface FormData {
  prompt: string;
  size: string;
}

export default function ImageGenerator({
  currentStyle,
  addImage,
}: ImageGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      prompt: "",
      size: "1024x1024",
    },
  });

  const currentPrompt = watch("prompt");

  // Apply the style to the prompt
  const getFullPrompt = () => {
    if (!currentStyle || !currentPrompt) return currentPrompt;
    return `${currentPrompt}, ${currentStyle}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const fullPrompt = getFullPrompt();

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: data.size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const result = await response.json();
      setGeneratedImageUrl(result.imageUrl);
      addImage(result.imageUrl);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Generate Image</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Prompt</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 text-black"
              placeholder="Describe what you want to see in the image..."
              {...register("prompt", { required: true })}
            />
            {currentStyle && (
              <div className="mt-2 text-sm text-gray-500">
                Style: <span className="font-medium">{currentStyle}</span>
              </div>
            )}
            {getFullPrompt() && currentStyle && (
              <div className="mt-2 text-sm text-black">
                <span className="font-medium">Full prompt:</span>{" "}
                {getFullPrompt()}
              </div>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Image Size</span>
            </label>
            <select
              className="select select-bordered text-black"
              {...register("size")}
            >
              <option value="1024x1024">1024x1024 (Square)</option>
              <option value="1024x1792">1024x1792 (Portrait)</option>
              <option value="1792x1024">1792x1024 (Landscape)</option>
            </select>
          </div>

          <button
            type="submit"
            className={`btn btn-primary mt-4 ${isLoading ? "loading" : ""}`}
            disabled={isLoading || !currentPrompt}
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </button>
        </form>

        {error && (
          <div className="alert alert-error mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {generatedImageUrl && !isLoading && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Generated Image:</h3>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={generatedImageUrl}
                alt="Generated image"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
