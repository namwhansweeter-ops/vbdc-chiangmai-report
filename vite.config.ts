import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // สำคัญ: ตั้งค่า base เป็น './' เพื่อให้ทำงานได้บน GitHub Pages
  base: './',
})