import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    // Don't minify the output for easier debugging
    minify: false,
    // Output to dist directory to avoid overwriting source
    outDir: 'dist',
    // Specify the entry point - use the actual source file
    rollupOptions: {
      input: {
        main: './index.html',
        worker: './js/worker.js'
      },
      output: {
        // Keep the same structure in dist
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'worker') {
            return 'js/worker.js';
          }
          return 'js/build.js';
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js'
      },
      external: (id) => {
        // Don't treat the worker as external when referenced from main
        if (id.includes('worker.js')) {
          return false;
        }
      }
    },
    // Copy public assets and additional directories
    copyPublicDir: false,
  },
  // Configure which additional files to copy
  assetsInclude: ['**/*.vox', '**/*.wav', '**/*.ogg', '**/*.png', '**/*.jpg'],
  // Use plugin to copy static assets
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'libs',
          dest: ''
        },
        {
          src: 'objects',
          dest: ''
        },
        {
          src: 'textures',
          dest: ''
        },
        {
          src: 'sound',
          dest: ''
        },
        {
          src: 'css',
          dest: ''
        },
        {
          src: 'media',
          dest: ''
        },
        {
          src: 'js/config-high.js',
          dest: 'js'
        },
        {
          src: 'js/config-low.js',
          dest: 'js'
        }
      ]
    })
  ],
  // Ensure worker modules are handled correctly
  worker: {
    format: 'es'
  }
});
