# 🦖 Chrome Dino 3D

A modern 3D remake of Chrome's beloved Dino game, built with Three.js and WebGL.

[Play the game](https://dino.addy.ie/) | [Low-fi version](https://dino.addy.ie/low.html)

## About

This is a 3D reimagining of Chrome's offline dinosaur game - that addictive little game you see when Chrome can't connect to the internet. The original game was created by Chrome's "Chrome UX" team members Edward Jung, Sebastien Gabriel and Alan Bettes in 2014, and has since become a beloved easter egg played by millions during internet outages.

While the original features charming pixel art in 2D, this version brings the T-Rex into the world of 3D while staying true to the original's aesthetic. All graphics were hand-crafted using Magica Voxel to maintain the game's iconic minimalist style.

![T-Rex Run 3D](https://i.imgur.com/fESLYlF.png)

## Controls

- **Jump**: Space, Arrow Up
- **Duck**: Arrow Down, Ctrl
- **Restart**: When game ends, press any key

## AI-Powered Game Feedback

This game features an AI feedback system that analyzes your performance and provides personalized tips to improve your gameplay. The AI uses a tiered/hybrid approach with multiple fallback options:

![Architecture](/architecture.png)

### AI Model Priority Flow

1. **Google Gemini 2.0 Flash** (Server-side) - Primary method until one of the local AI models are loaded/accessible
2. [**Chrome/Edge Prompt API**](https://developer.chrome.com/docs/extensions/ai/prompt-api) (Built-in browser AI) - Local fallback for supported browsers
3. [**Transformers.js**](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct) (Local SmolLM2-1.7B model) - Fallback if Prompt API is not supported

The game automatically detects available AI capabilities and selects the best option. If local models fail, it gracefully falls back to the server-side Gemini API.

### AI Language Translation

The game features built-in language translation powered by the [Translation API](https://github.com/webmachinelearning/translation-api). This AI-powered system automatically translates:

- Game interface elements
- AI feedback and tips
- Game instructions and controls

The translation system supports multiple languages, with the full list available on the [here](/index.html). If your preferred language isn't supported, you can either:
- Open an issue to request language support
- Submit a pull request to add new language translations

### Browser Compatibility

The [Prompt API](https://github.com/webmachinelearning/prompt-api) and [Translation API](https://github.com/webmachinelearning/translation-api) are currently available in Chrome and Edge Dev/Canary browsers behind feature flags. This is not yet a feature in other browsers!

The Transformer.js model should be supported by every browser with [WebGPU support](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility).


## Running Locally

### Quick Start (No Google Gemini functionality)

```bash
git clone https://github.com/addyosmani/chrome-dino-3d
cd chrome-dino-3d
npm install
npm run dev
```

### Full Development Setup (with AI Features)

For local development with complete AI functionality:

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/addyosmani/chrome-dino-3d
   cd chrome-dino-3d
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your Google Gemini API key:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the development server:**

   ```bash
   npm run dev:vercel
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to play the game locally.

### AI Development Notes

- **Local AI Models**: Chrome Prompt API and Transformers.js models run entirely in the browser
- **Fallback System**: If local models fail to load, the game automatically falls back to server-side AI (Gemini 2.0 Flash)
- **WebGPU Required**: Transformers.js & the Prompt API require a WebGPU-compatible browser for optimal performance

## Credits

This project is a modernized fork of the original work by Abraham Tugalov ([@priler](https://github.com/priler/dino3d)).

Built with:

- [Three.js](https://threejs.org/) - WebGL 3D Library
- [MagicaVoxel](https://ephtracy.github.io/) - Voxel art editor
- [vox.js](https://github.com/daishihmr/vox.js/) - MagicaVoxel parser
- [howler.js](https://github.com/goldfire/howler.js/) - Audio library
- [three-nebula](https://github.com/creativelifeform/three-nebula) - Particle system
- [visibly.js](https://github.com/addyosmani/visibly.js/) - Page Visibility API
- [Google Gemini](https://ai.google.dev/) - AI-powered game feedback
- [Chrome Prompt & Translator API](https://developer.chrome.com/docs/ai/built-in-apis) - Built-in browser AI
- [Transformers.js](https://huggingface.co/docs/transformers.js/v3.0.0/index) - Local AI models

## License

License information available in the LICENSE file.
