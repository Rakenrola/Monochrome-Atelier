import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    },
    host: true, // Listens on all network addresses
    allowedHosts: [
      'unknowing-passivism-shopper.ngrok-free.dev', // Allows your specific ngrok domain
      '.ngrok-free.dev', // Allows ANY free ngrok domain wildcard
    ],
  }
})
