
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Allow proxy targets to be set via environment variables (for dev flexibility)
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:9090';
const ASSISTANT_PROXY_TARGET = process.env.VITE_ASSISTANT_PROXY_TARGET || 'http://localhost:9000';
const AUTH_SERVER_TARGET = process.env.VITE_AUTH_SERVER_TARGET || 'https://localhost:9443';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@features': resolve(__dirname, 'src/features'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@config': resolve(__dirname, 'src/config'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    cors: true,
    proxy: {
      // Proxy OAuth2 requests to Auth Server (port 9443)
      '/oauth2': {
        target: AUTH_SERVER_TARGET,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('OAuth2 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying OAuth2 request:', req.method, req.url, '->', AUTH_SERVER_TARGET);
          });
        }
      },
      // Proxy API requests (with /api prefix) to UIDAM User Management
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying API request:', req.method, req.url, '-> http://localhost:9090');
          });
        }
      },
      // Proxy User Management API requests to avoid CORS issues (legacy paths)
      '/v1': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('User Management API v1 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying User Management API v1 request:', req.method, req.url, '-> http://localhost:9090');
          });
        }
      },
      // Proxy User Management API v2 requests to avoid CORS issues
      '/v2': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('User Management API v2 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying User Management API v2 request:', req.method, req.url, '-> http://localhost:9090');
          });
        }
      }
      ,
      // Proxy assistant endpoints from agent (chat/session) -> UIDAM Agent on port 9000
      '/chat': {
        target: ASSISTANT_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/session': {
        target: ASSISTANT_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})
