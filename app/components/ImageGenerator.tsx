"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

interface ImageGeneratorProps {
  currentStyle: string;
  addImage: (imageUrl: string) => void;
}

interface FormData {
  prompt: string;
  size: string;
  apiKey: string;
}

export default function ImageGenerator({
  currentStyle,
  addImage,
}: ImageGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState<number[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      prompt: "",
      size: "1024x1024",
      apiKey: "",
    },
  });

  // Load the API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
      setValue("apiKey", savedApiKey);
    }
  }, [setValue]);

  const currentPrompt = watch("prompt");
  const apiKey = watch("apiKey");

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openai-api-key", apiKey);
    }
  }, [apiKey]);

  // Apply the style to the prompt
  const getFullPrompt = () => {
    if (!currentStyle || !currentPrompt) return currentPrompt;
    return `${currentPrompt}, ${currentStyle}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls([]);
    setGenerationProgress([0, 0, 0, 0]); // Reset progress for all 4 images

    try {
      const fullPrompt = getFullPrompt();

      // Create a controller to abort the fetch request if needed
      const controller = new AbortController();

      // Fetch options
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: data.size,
          apiKey: data.apiKey,
        }),
        signal: controller.signal,
      };

      // Function to handle streaming response
      const handleStream = async (response: Response) => {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and add it to the buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.substring(6));

                // Handle different event types
                if (eventData.error) {
                  setError(eventData.error);
                } else if (eventData.imageUrl) {
                  // Add the image to our state array
                  setGeneratedImageUrls((prev) => {
                    const newUrls = [...prev];
                    newUrls[eventData.index] = eventData.imageUrl;
                    return newUrls;
                  });

                  // Add to gallery
                  addImage(eventData.imageUrl);

                  // Update progress
                  setGenerationProgress((prev) => {
                    const newProgress = [...prev];
                    newProgress[eventData.index] = 100; // 100% complete
                    return newProgress;
                  });
                } else if (eventData.status === "generating") {
                  // Update progress to show we're working on this image
                  setGenerationProgress((prev) => {
                    const newProgress = [...prev];
                    newProgress[eventData.index] = 50; // 50% - in progress
                    return newProgress;
                  });
                } else if (eventData.status === "complete") {
                  // All done
                  setIsLoading(false);
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      };

      // Start the request
      const response = await fetch("/api/generate-image", fetchOptions);

      if (!response.ok) {
        if (
          response.headers.get("Content-Type")?.includes("application/json")
        ) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        } else {
          throw new Error(`HTTP error ${response.status}`);
        }
      }

      // Handle the streaming response
      await handleStream(response);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the image");
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-black">Generate Image</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">OpenAI API Key</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </label>
            <input
              type={showApiKey ? "text" : "password"}
              className="input input-bordered text-black"
              placeholder="Enter your OpenAI API key"
              {...register("apiKey")}
            />
            <div className="text-xs text-gray-500 mt-1">
              Your API key is stored locally in your browser and never sent to
              our servers.
            </div>
          </div>

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
                <span className="font-medium">
                  {currentStyle.includes("combined with")
                    ? "Merged Styles:"
                    : "Selected Style:"}
                </span>
                {currentStyle}
              </div>
            )}
            {getFullPrompt() && currentStyle && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-sm text-black">
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
            disabled={isLoading || !currentPrompt || !apiKey}
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </button>

          {!apiKey && (
            <div className="text-sm text-orange-500 mt-2">
              Please enter your OpenAI API key to generate images
            </div>
          )}
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

        {/* Display images as they are generated */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">Generated Images:</h3>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100"
              >
                {generatedImageUrls[index] ? (
                  <img
                    src={generatedImageUrls[index]}
                    alt={`Generated image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {generationProgress[index] > 0 ? (
                      <div className="text-center">
                        <div
                          className="radial-progress text-primary"
                          style={
                            {
                              "--value": generationProgress[index],
                            } as React.CSSProperties
                          }
                        >
                          {generationProgress[index]}%
                        </div>
                        <p className="text-sm mt-2">Image {index + 1}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Waiting...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
