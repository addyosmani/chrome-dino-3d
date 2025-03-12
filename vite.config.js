import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Custom plugin to handle file inlining
function fileInlinerPlugin() {
  return {
    name: 'file-inliner',
    transform(code, id) {
      // Only process the build.js file
      if (!id.endsWith('js/src/build.js')) {
        return null;
      }

      // Replace each //= filename.js with the contents of that file
      const regex = /\/\/= (.+)\.js/g;
      let result = code;
      let match;

      while ((match = regex.exec(code)) !== null) {
        const fileName = match[1];
        const filePath = path.resolve(process.cwd(), 'js/src', `${fileName}.js`);
        
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          result = result.replace(match[0], fileContent);
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
      }

      return result;
    }
  };
}

export default defineConfig({
  plugins: [fileInlinerPlugin()],
  build: {
    // Don't minify the output
    minify: false,
    // Specify the entry point
    rollupOptions: {
      input: 'js/src/build.js',
      output: {
        // Output to js/build.js
        dir: '.',
        entryFileNames: 'js/build.js',
        // format: 'iife',
        // Don't generate code splitting chunks
        manualChunks: undefined,
      },
    },
    // Don't generate any other files
    emptyOutDir: false,
    // Don't copy public assets
    copyPublicDir: false,
  }
});
