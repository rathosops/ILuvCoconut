import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly'
};

const browserGlobals = {
  document: 'readonly',
  HTMLElement: 'readonly',
  window: 'readonly'
};

const typedRules = {
  '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  '@typescript-eslint/explicit-function-return-type': [
    'error',
    {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }
  ],
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }
  ],
  'no-magic-numbers': [
    'warn',
    {
      ignore: [-1, 0, 1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreClassFieldInitialValues: true,
      enforceConst: true
    }
  ],
  'max-lines': [
    'warn',
    {
      max: 300,
      skipBlankLines: true,
      skipComments: true
    }
  ],
  'max-lines-per-function': [
    'warn',
    {
      max: 90,
      skipBlankLines: true,
      skipComments: true
    }
  ],
  complexity: ['warn', { max: 12 }],
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    {
      allowBoolean: true,
      allowNumber: true
    }
  ]
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/player-cocos/library/**',
      'apps/player-cocos/temp/**',
      'apps/player-cocos/local/**'
    ]
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'apps/player-pixi/vite.config.ts',
            'apps/coconut-studio/vite.config.ts',
            'apps/player-cocos/assets/scripts/*.ts'
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: typedRules
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      // Layout literals (icon sizes, spacing) are not "magic" in markup; keep the
      // rule strict for .ts logic, relaxed for the .tsx view layer.
      'no-magic-numbers': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    files: ['**/*Constants.ts'],
    rules: {
      'no-magic-numbers': 'off'
    }
  },
  {
    files: ['apps/player-pixi/vite.config.ts', 'apps/coconut-studio/vite.config.ts', 'apps/player-cocos/assets/scripts/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off'
    }
  },
  {
    files: ['packages/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: nodeGlobals
    }
  },
  {
    files: ['apps/player-pixi/**/*.ts', 'apps/player-cocos/**/*.ts', 'apps/coconut-studio/**/*.ts', 'apps/coconut-studio/**/*.tsx'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...nodeGlobals
      }
    }
  },
  {
    files: ['*.config.js', '*.config.ts', 'apps/**/vite.config.ts'],
    languageOptions: {
      globals: nodeGlobals
    }
  }
);
