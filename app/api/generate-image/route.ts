import { NextResponse } from "next/server";
import OpenAI from "openai";

// Helper function to create SSE response
function createSSEResponse(readable: ReadableStream) {
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  // Create a TransformStream to write SSE messages
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Handle the request asynchronously
  (async () => {
    // Text encoder for writing to the stream
    const encoder = new TextEncoder();

    try {
      // Parse the request body
      const body = await request.json();
      const { prompt, size = "1024x1024", apiKey, referenceImageUrl } = body;

      // Validate the request
      if (!prompt) {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Prompt is required" })}\n\n`
          )
        );
        writer.close();
        return;
      }

      // Validate API key
      const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "OpenAI API key is required",
            })}\n\n`
          )
        );
        writer.close();
        return;
      }

      // Initialize the OpenAI client with the provided API key
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      // Validate size parameter
      const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
      if (!validSizes.includes(size)) {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              error:
                "Invalid size parameter. Must be one of: 1024x1024, 1024x1792, 1792x1024",
            })}\n\n`
          )
        );
        writer.close();
        return;
      }

      // Validate reference image URL if provided
      if (referenceImageUrl) {
        try {
          // This is a simple validation to check if the URL is valid
          new URL(referenceImageUrl);

          // Log that we're using a reference image
          console.log(`Using reference image URL: ${referenceImageUrl}`);

          // If you want to verify the image exists and is accessible,
          // you could make a HEAD request here, but we'll skip that for now
        } catch (error) {
          writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Invalid reference image URL",
              })}\n\n`
            )
          );
          writer.close();
          return;
        }
      }

      // Enhance the prompt with reference image information if provided
      let enhancedPrompt = prompt;
      if (referenceImageUrl) {
        // Note: OpenAI API doesn't directly support image-to-image style transfer,
        // so we're enhancing the prompt to guide it to use the style
        enhancedPrompt = `${prompt} 
          
Important: Please generate an image that closely mimics the artistic style, composition techniques, color palette, 
and visual aesthetic of the reference image at: ${referenceImageUrl}. 

The content should be based on my description, but the visual style should match the reference.`;
      }

      // Generate 4 images one by one
      for (let i = 0; i < 4; i++) {
        try {
          // Send progress update
          writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ status: "generating", index: i })}\n\n`
            )
          );

          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: size as "1024x1024" | "1024x1792" | "1792x1024",
            // We could use the quality parameter to improve results for style matching
            quality: referenceImageUrl ? "hd" : "standard",
            // A higher style_preset might help with consistency across images
            style: "vivid",
          });

          if (response.data[0].url) {
            // Send the image URL as soon as it's generated
            writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  imageUrl: response.data[0].url,
                  index: i,
                })}\n\n`
              )
            );
          }
        } catch (generationError: any) {
          console.error(`Error generating image ${i + 1}:`, generationError);
          // Send error for this specific image
          writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  generationError.message ||
                  `Failed to generate image ${i + 1}`,
                index: i,
              })}\n\n`
            )
          );
        }
      }

      // Signal completion
      writer.write(
        encoder.encode(`data: ${JSON.stringify({ status: "complete" })}\n\n`)
      );
      writer.close();
    } catch (error: any) {
      console.error("Error generating image:", error);

      // Handle general errors
      if (error.response) {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              error:
                error.response.data?.error?.message || "Error from OpenAI API",
            })}\n\n`
          )
        );
      } else {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Failed to generate image" })}\n\n`
          )
        );
      }
      writer.close();
    }
  })();

  // Return the stream immediately
  return createSSEResponse(stream.readable);
}
