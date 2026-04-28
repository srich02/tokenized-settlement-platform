import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT || 'http://localhost:3001'),
    'import.meta.env.VITE_COGNITO_USER_POOL_ID': JSON.stringify(process.env.VITE_COGNITO_USER_POOL_ID || ''),
    'import.meta.env.VITE_COGNITO_CLIENT_ID': JSON.stringify(process.env.VITE_COGNITO_CLIENT_ID || ''),
    'import.meta.env.VITE_AWS_REGION': JSON.stringify(process.env.VITE_AWS_REGION || 'ap-south-1'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_ENDPOINT || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
