"use client";

import { useState, useEffect } from "react";
import ImageGenerator from "./components/ImageGenerator";
import StylePresets from "./components/StylePresets";
import Gallery from "./components/Gallery";

// Interface for history items
interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  size: string;
  imageUrls: string[];
  timestamp: number;
}

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [currentStyle, setCurrentStyle] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("openai-image-history");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);

        // Also populate the gallery with the latest images
        if (parsedHistory.length > 0) {
          const latestItem = parsedHistory[0];
          setImages(latestItem.imageUrls);
        }
      } catch (error) {
        console.error("Error parsing history from localStorage:", error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("openai-image-history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (
    prompt: string,
    style: string,
    size: string,
    newImageUrls: string[]
  ) => {
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      prompt,
      style,
      size,
      imageUrls: newImageUrls,
      timestamp: Date.now(),
    };

    setHistory((prevHistory) => [newHistoryItem, ...prevHistory]);
  };

  const addImage = (
    imageUrl: string,
    prompt?: string,
    style?: string,
    size?: string
  ) => {
    setImages((prev) => {
      const newImages = [...prev, imageUrl];

      // If we have all the metadata for this generation, add it to history
      if (prompt && style && size) {
        // We'll collect all images from this batch before adding to history
        // This is why we're checking if this is the 4th image (assuming 4 per generation)
        if (newImages.length % 4 === 0) {
          // Get the last 4 images
          const lastFourImages = newImages.slice(-4);
          addToHistory(prompt, style, size, lastFourImages);
        }
      }

      return newImages;
    });
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // Load the images from this history item into the gallery
    setImages(item.imageUrls);

    // You could also set the current style to match the history item
    setCurrentStyle(item.style);

    // Return the prompt for reuse in the generator
    return {
      prompt: item.prompt,
      style: item.style,
      size: item.size,
    };
  };

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center my-8">
        OpenAI Image Generator with Consistent Style
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <StylePresets setCurrentStyle={setCurrentStyle} />
          <ImageGenerator
            currentStyle={currentStyle}
            addImage={addImage}
            history={history}
            onLoadHistoryItem={loadHistoryItem}
          />
        </div>

        <Gallery
          images={images}
          history={history}
          onLoadHistoryItem={loadHistoryItem}
        />
      </div>
    </main>
  );
}
