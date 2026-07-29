import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // eslint-plugin-boundaries can't classify ANY dependency (even relative imports)
      // without a resolver — without this, the rule below silently matches nothing.
      // TypeScript-aware so the `@/*` alias from apps/web/tsconfig.json resolves too.
      'import/resolver': {
        typescript: {
          project: new URL('./apps/web/tsconfig.json', import.meta.url).pathname,
        },
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/web/src/app/*' },
        { type: 'pages', pattern: 'apps/web/src/pages/*' },
        { type: 'widgets', pattern: 'apps/web/src/widgets/*' },
        { type: 'features', pattern: 'apps/web/src/features/*' },
        { type: 'entities', pattern: 'apps/web/src/entities/*' },
        { type: 'shared', pattern: 'apps/web/src/shared/*' },
      ],
    },
    rules: {
      // FSD: yuqori qatlam faqat pastdagini import qiladi.
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
                to: { element: { types: { anyOf: ['widgets', 'features', 'entities', 'shared'] } } },
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
