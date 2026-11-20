import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel, { defineRolldownBabelPreset } from '@rolldown/plugin-babel'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const reactCompilerPreset = defineRolldownBabelPreset({
  preset: () => ({
    plugins: [require.resolve('babel-plugin-react-compiler')],
  }),
  rolldown: {
    filter: {
      code: /forwardRef|memo|\b(?:[A-Z]|use[A-Z0-9])/,
    },
    applyToEnvironmentHook: (env) => env.config.consumer === 'client',
    optimizeDeps: {
      include: ['react/compiler-runtime'],
    },
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset] })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
