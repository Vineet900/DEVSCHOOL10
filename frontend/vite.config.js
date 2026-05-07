import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const frontendDir = process.cwd()
  const repoRoot = path.resolve(frontendDir, '..')
  const mergedEnv = {
    ...loadEnv(mode, repoRoot, ''),
    ...loadEnv(mode, frontendDir, ''),
  }

  const clientEnv = Object.fromEntries(
    Object.entries(mergedEnv)
      .filter(([key]) => key.startsWith('VITE_'))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  )

  return {
    plugins: [react(), tailwindcss()],
    define: clientEnv,
    server: {
      port: 5173,
    },
  }
})
