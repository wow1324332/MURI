import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext' // 모던 브라우저 지원을 위해 ESNext 타겟팅
  }
})
