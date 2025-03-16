# OpenAI Image Generator with Consistent Style

This is a Next.js application that uses the OpenAI API to generate images with consistent styles. The application allows you to:

- Generate images using DALL-E 3
- Apply consistent style presets to your generations
- Create and use custom styles
- View a gallery of your generated images

## Prerequisites

- Node.js 18.x or later
- pnpm (Package manager)
- An OpenAI API key with access to DALL-E 3

## Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/openai-image-generator.git
   cd openai-image-generator
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Features

### Style Presets

The application comes with several predefined style presets:

- Watercolor
- Cyberpunk
- Vintage
- Anime
- Oil Painting
- Custom Style (define your own)

These presets help maintain consistency across multiple image generations.

### Image Generation

1. Select a style preset (or create a custom one)
2. Enter a prompt describing what you want to see in the image
3. Choose an image size (square, portrait, or landscape)
4. Click "Generate Image"

The application will combine your prompt with the selected style and send it to the OpenAI API.

### Gallery

All generated images are displayed in the gallery section, allowing you to see your creation history.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- DaisyUI
- OpenAI API (DALL-E 3)

## License

MIT
