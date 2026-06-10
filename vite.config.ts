import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts'],
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    plugins: ['typescript'],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      { files: ['packages/dvbcss-node/**'], env: { node: true } },
      { files: ['packages/dvbcss-browser/**'], env: { browser: true } },
      { files: ['**/*.test.ts'], plugins: ['typescript', 'vitest'] },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
});
