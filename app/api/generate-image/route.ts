import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { prompt, size = "1024x1024" } = body;

    // Validate the request
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate size parameter
    const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        {
          error:
            "Invalid size parameter. Must be one of: 1024x1024, 1024x1792, 1792x1024",
        },
        { status: 400 }
      );
    }

    // Call OpenAI API to generate the image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 4,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
    });

    // Extract all image URLs from the response
    const imageUrls = response.data.map((image) => image.url);

    // Return all image URLs
    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    console.error("Error generating image:", error);

    // Handle OpenAI API errors
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.error.message || "Error from OpenAI API" },
        { status: error.response.status }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
