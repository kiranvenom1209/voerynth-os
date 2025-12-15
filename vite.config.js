import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for Electron/Capacitor to find assets
  build: {
    target: 'esnext', // Use modern JS features for better performance
    minify: 'esbuild', // Fast and efficient minification
    cssMinify: true,
    sourcemap: false, // Disable sourcemaps for production to reduce bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
          'zustand': ['zustand']
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    // Optimize for mobile performance
    reportCompressedSize: false, // Faster builds
    cssCodeSplit: true, // Split CSS for better caching
    assetsInlineLimit: 4096 // Inline assets smaller than 4kb
  },
  server: {
    host: true // Expose for local network testing
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: ['@capacitor/core', '@capacitor/android']
  }
})