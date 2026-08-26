import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

// Self-contained flat config for the @rieltor/agent workspace. Turbo (and the
// package-scoped `lint` script) runs ESLint with this directory as the cwd, so
// ESLint resolves THIS file rather than the repo-root eslint.config.mjs. It
// mirrors the web config's FSD `boundaries` setup, scoped to apps/agent/src.
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.turbo/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // eslint-plugin-boundaries can't classify ANY dependency (even relative imports)
      // without a resolver. TypeScript-aware so the `@/*` alias from tsconfig resolves too.
      'import/resolver': {
        typescript: {
          project: new URL('./tsconfig.json', import.meta.url).pathname,
        },
      },
      // Pin the root path so element matching is cwd-independent (turbo runs per-package).
      'boundaries/root-path': new URL('.', import.meta.url).pathname,
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'pages', pattern: 'src/pages/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
    },
    rules: {
      // FSD: a layer may only import from the layers below it.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['pages', 'widgets', 'features', 'entities', 'shared'] },
                  },
                },
              },
            },
            {
              from: { element: { type: 'pages' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['widgets', 'features', 'entities', 'shared'] } },
                },
              },
            },
            {
              from: { element: { type: 'widgets' } },
              allow: { to: { element: { types: { anyOf: ['features', 'entities', 'shared'] } } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } },
            },
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },
);
