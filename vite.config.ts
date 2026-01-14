import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // lub inny plugin, którego używasz

export default defineConfig({
  plugins: [react()],
  base: '/Fast-typing/',
})
