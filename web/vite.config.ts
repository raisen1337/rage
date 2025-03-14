import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VitePluginTailwindcss from 'vite-plugin-tailwindcss'


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), VitePluginTailwindcss()],
})
