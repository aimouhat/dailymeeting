import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
<<<<<<< HEAD
    host: '0.0.0.0', // Bind to all network interfaces
    port: 60, // Use default HTTP port (no port needed in URL)
    strictPort: true,
    allowedHosts: ['dailymeeting.ocp', 'localhost', '127.0.0.1'],
=======
    host: '0.0.0.0', // Allow access from any IP
    port: 5173,
    strictPort: true,
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    hmr: {
      overlay: false // Disable HMR overlay
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true
  }
});
