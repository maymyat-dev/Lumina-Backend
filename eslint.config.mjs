// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import * as importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'node_modules', 'dist', 'build'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
      unicorn,
      prettier
    },
  },
  {
    rules: {
      // ✏️ Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'function', format: ['camelCase', 'PascalCase'] }, // e.g. `getUser`
        { selector: 'variable', format: ['camelCase', 'snake_case', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' }, // e.g. `userData`, `user_id`, `USER_ID`, `ResponseData`
        { selector: 'class', format: ['PascalCase'] }, // e.g. `UserController` 
        { selector: 'interface', format: ['PascalCase'], leadingUnderscore: 'forbid' }, // e.g. `IUserController`
        { selector: 'classProperty', format: ['camelCase', 'snake_case', 'UPPER_CASE'] }, // e.g. `userId` or `user_id`
      ],

      // 📁 File naming: kebab-case
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true, // e.g. `user-controller.ts`
            pascalCase: true, // e.g. `UserController.ts`
          },
        },
      ],

      'no-multiple-empty-lines': ['error', { max: 2 }],

      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],

      semi: ['error', 'always'], // e.g. const a = 1;
      curly: 'warn', // e.g. if (a) { } else { } instead of if (a) { } else a();
      'prefer-template': 'warn', // Warn if using + instead of template strings
      
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error', // any type
      '@typescript-eslint/no-floating-promises': 'warn', // Promise without await
      '@typescript-eslint/no-unsafe-argument': 'warn', // Argument of type 'unknown' is not assignable to parameter of type 'string'
      'import/no-unresolved': 'off', // Unable to resolve path to module
      'no-unreachable': 'error', // Unreachable code after return, throw, continue, or break
      'no-console': 'off',
      'import/order': [
        'warn',
        {
          alphabetize: { order: 'asc', caseInsensitive: true }, // Sort imports A → Z, ignoring case
          groups: [
            'builtin', // Built-in Node.js modules
            'external', // External modules
            'internal', // Internal modules
            'parent', // e.g. `../utils`
            'sibling', // e.g. `./helper`
            'index',  // e.g. `./`
            'type', // TypeScript type-only imports
            'object',
          ],
          'newlines-between': 'always', // Require a blank line between each group
        },
      ],
    },
  },
  prettierConfig
);