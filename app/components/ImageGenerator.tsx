"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// Interface for history items
interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  size: string;
  imageUrls: string[];
  timestamp: number;
}

interface ImageGeneratorProps {
  currentStyle: string;
  addImage: (
    imageUrl: string,
    prompt?: string,
    style?: string,
    size?: string
  ) => void;
  history?: HistoryItem[];
  onLoadHistoryItem?: (item: HistoryItem) => {
    prompt: string;
    style: string;
    size: string;
  };
}

interface FormData {
  prompt: string;
  size: string;
  apiKey: string;
  referenceImageUrl: string;
}

export default function ImageGenerator({
  currentStyle,
  addImage,
  history = [],
  onLoadHistoryItem,
}: ImageGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState<number[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [useReferenceImage, setUseReferenceImage] = useState(false);
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      prompt: "",
      size: "1024x1024",
      apiKey: "",
      referenceImageUrl: "",
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
  const currentSize = watch("size");
  const apiKey = watch("apiKey");
  const referenceImageUrl = watch("referenceImageUrl");

  // Update reference image preview when URL changes
  useEffect(() => {
    if (useReferenceImage && referenceImageUrl) {
      setReferenceImagePreview(referenceImageUrl);
    } else {
      setReferenceImagePreview(null);
    }
  }, [referenceImageUrl, useReferenceImage]);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openai-api-key", apiKey);
    }
  }, [apiKey]);

  // Apply the style to the prompt
  const getFullPrompt = () => {
    if (!currentPrompt) return "";

    // If using a reference image, mention it in the prompt
    if (useReferenceImage && referenceImageUrl) {
      return `${currentPrompt}, in the same style as the reference image`;
    }

    // Otherwise use the text-based style
    if (currentStyle) {
      return `${currentPrompt}, ${currentStyle}`;
    }

    return currentPrompt;
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
          referenceImageUrl: useReferenceImage ? data.referenceImageUrl : null,
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

                  // Add to gallery with additional metadata
                  const effectiveStyle = useReferenceImage
                    ? `Reference image: ${data.referenceImageUrl}`
                    : currentStyle;

                  addImage(
                    eventData.imageUrl,
                    data.prompt,
                    effectiveStyle,
                    data.size
                  );

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

  const loadHistoryItem = (item: HistoryItem) => {
    if (onLoadHistoryItem) {
      const { prompt, size } = onLoadHistoryItem(item);
      setValue("prompt", prompt);
      setValue("size", size);

      // Check if the style is a reference image URL
      if (item.style && item.style.startsWith("Reference image: ")) {
        const referenceUrl = item.style.replace("Reference image: ", "");
        setValue("referenceImageUrl", referenceUrl);
        setUseReferenceImage(true);
      } else {
        setValue("referenceImageUrl", "");
        setUseReferenceImage(false);
      }

      setShowHistory(false); // Close history panel after selection
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Function to use an existing generated image as reference
  const useAsReference = (imageUrl: string) => {
    setValue("referenceImageUrl", imageUrl);
    setUseReferenceImage(true);
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
            <div className="flex justify-between items-center">
              <label className="label">
                <span className="label-text">Prompt</span>
              </label>
              {history.length > 0 && (
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
              )}
            </div>
            <textarea
              className="textarea textarea-bordered h-24 text-black"
              placeholder="Describe what you want to see in the image..."
              {...register("prompt", { required: true })}
            />

            {/* Style selection method toggle */}
            <div className="mt-4 flex items-center">
              <label className="cursor-pointer label justify-start gap-2">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={useReferenceImage}
                  onChange={() => setUseReferenceImage(!useReferenceImage)}
                />
                <span className="label-text">
                  Use reference image for style
                </span>
              </label>
            </div>

            {/* Reference image URL input */}
            {useReferenceImage && (
              <div className="mt-2">
                <input
                  type="text"
                  className="input input-bordered w-full text-black"
                  placeholder="Enter reference image URL"
                  {...register("referenceImageUrl")}
                />

                {/* Reference image preview */}
                {referenceImagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      Reference image:
                    </p>
                    <div className="relative w-32 h-32 overflow-hidden rounded-lg">
                      <img
                        src={referenceImagePreview}
                        alt="Style reference"
                        className="object-cover w-full h-full"
                        onError={() => setReferenceImagePreview(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!useReferenceImage && currentStyle && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-medium">
                  {currentStyle.includes("combined with")
                    ? "Merged Styles:"
                    : "Selected Style:"}
                </span>
                {currentStyle}
              </div>
            )}

            {getFullPrompt() && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-sm text-black">
                <span className="font-medium">Full prompt:</span>{" "}
                {getFullPrompt()}
              </div>
            )}
          </div>

          {/* History panel */}
          {showHistory && history.length > 0 && (
            <div className="bg-gray-100 p-3 rounded-lg mt-2 mb-2 max-h-64 overflow-y-auto">
              <h3 className="font-medium mb-2">Prompt History</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-2 rounded cursor-pointer hover:bg-blue-50 text-black"
                    onClick={() => loadHistoryItem(item)}
                  >
                    <p className="font-medium text-sm truncate">
                      {item.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex space-x-2">
                        <span className="text-xs bg-gray-200 px-1 rounded">
                          {item.size}
                        </span>
                        {item.imageUrls.length > 0 && (
                          <span className="text-xs bg-gray-200 px-1 rounded">
                            {item.imageUrls.length} images
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            disabled={
              isLoading ||
              !currentPrompt ||
              !apiKey ||
              (useReferenceImage && !referenceImageUrl)
            }
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </button>

          {!apiKey && (
            <div className="text-sm text-orange-500 mt-2">
              Please enter your OpenAI API key to generate images
            </div>
          )}

          {useReferenceImage && !referenceImageUrl && (
            <div className="text-sm text-orange-500 mt-2">
              Please provide a reference image URL
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Generated Images:</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100"
              >
                {generatedImageUrls[index] ? (
                  <div className="group relative h-full">
                    <img
                      src={generatedImageUrls[index]}
                      alt={`Generated image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          useAsReference(generatedImageUrls[index])
                        }
                      >
                        Use as Reference
                      </button>
                    </div>
                  </div>
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
