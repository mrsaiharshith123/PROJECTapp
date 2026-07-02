import js from '@eslint/js'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'dev-dist',
    'dist-ota',
    'dist-ota-test',
    'dist-ota-verify',
    'android/**',
    'releases/**',
    'node_modules/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Valid sync-on-navigation / auth-callback patterns; refactor opportunistically.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react/button-has-type': 'error',
    },
  },
  {
    files: ['src/context/**/*.{js,jsx}', 'src/ui/primitives/Input.jsx', 'src/hooks/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/ui/features/plan/planToolPanels.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
