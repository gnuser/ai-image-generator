"use client";

import { useState } from "react";

// Interface for history items
interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  size: string;
  imageUrls: string[];
  timestamp: number;
}

interface GalleryProps {
  images: string[];
  history?: HistoryItem[];
  onLoadHistoryItem?: (item: HistoryItem) => {
    prompt: string;
    style: string;
    size: string;
  };
}

export default function Gallery({
  images,
  history = [],
  onLoadHistoryItem,
}: GalleryProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    if (onLoadHistoryItem) {
      onLoadHistoryItem(item);
    }
  };

  if (images.length === 0 && history.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl h-full">
        <div className="card-body flex flex-col items-center justify-center text-center">
          <h2 className="card-title">Your Gallery</h2>
          <p className="text-gray-500">Generated images will appear here</p>
          <div className="mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title text-black">Your Gallery</h2>
          {history.length > 0 && (
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setShowFullHistory(!showFullHistory)}
            >
              {showFullHistory ? "Hide History" : "Show All History"}
            </button>
          )}
        </div>

        {showFullHistory ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {history.length}{" "}
              {history.length === 1 ? "saved generation" : "saved generations"}
            </p>

            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-base-200 p-4 rounded-lg cursor-pointer hover:bg-base-300"
                  onClick={() => handleLoadHistoryItem(item)}
                >
                  <div className="mb-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-black">{item.prompt}</p>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs bg-gray-200 px-1 rounded">
                        {item.size}
                      </span>
                      <span className="text-xs bg-gray-200 px-1 rounded">
                        {item.imageUrls.length} images
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {item.imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={url}
                          alt={`Generated image ${idx + 1} for "${
                            item.prompt
                          }"`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {images.length} {images.length === 1 ? "image" : "images"}{" "}
              generated
            </p>

            <div className="grid grid-cols-2 gap-4">
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div className="text-center mt-4">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowFullHistory(true)}
                >
                  View All Previous Generations
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
