import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local-first: sem proxy, sem backend. O build é um app estático.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
})
