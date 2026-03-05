import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Voerynth OS',
        short_name: 'Voerynth',
        description: 'Vœrynth Système OS - Bespoke Residential Command Protocol',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: process.env.VITE_PLATFORM === 'electron' ? './' : '/', // './' for Electron, '/' for web
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
    exclude: []
  }
})