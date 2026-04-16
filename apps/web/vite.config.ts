import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Internal monorepo packages
      '@snaptik/ui':    path.resolve(__dirname, './src/ui'),
      '@snaptik/types': path.resolve(__dirname, './src/types'),
      // Path alias
      '@': path.resolve(__dirname, './src'),
      // Next.js shims — map all next/* imports to local shims
      'next/link':       path.resolve(__dirname, './src/shims/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.ts'),
      'next/image':      path.resolve(__dirname, './src/shims/next-image.tsx'),
      'next':            path.resolve(__dirname, './src/shims/next.ts'),
    },
  },
});
