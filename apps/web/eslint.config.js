// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

// Clean Architecture per bounded context: domain imports only domain; application adds its own
// layer; neither imports a framework or library (AGENTS.md section 4).
const PURE = { to: { module: { origin: 'external' } } };

module.exports = defineConfig([
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts'] } },
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/app/*/domain' },
        { type: 'application', pattern: 'src/app/*/application' },
        { type: 'ui', pattern: 'src/app' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          checkAllOrigins: true,
          policies: [
            { from: { element: { type: 'domain' } }, disallow: PURE },
            {
              from: { element: { type: 'domain' } },
              disallow: { to: { element: { types: ['application', 'ui'] } } },
            },
            { from: { element: { type: 'application' } }, disallow: PURE },
            {
              from: { element: { type: 'application' } },
              disallow: { to: { element: { type: 'ui' } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
