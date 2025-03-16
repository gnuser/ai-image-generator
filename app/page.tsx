"use client";

import { useState } from "react";
import ImageGenerator from "./components/ImageGenerator";
import StylePresets from "./components/StylePresets";
import Gallery from "./components/Gallery";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [currentStyle, setCurrentStyle] = useState<string>("");

  const addImage = (imageUrl: string) => {
    setImages((prev) => [...prev, imageUrl]);
  };

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center my-8">
        OpenAI Image Generator with Consistent Style
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <StylePresets setCurrentStyle={setCurrentStyle} />
          <ImageGenerator currentStyle={currentStyle} addImage={addImage} />
        </div>

        <Gallery images={images} />
      </div>
    </main>
  );
}
