// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylisticJs from '@stylistic/eslint-plugin-js'

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  rules: {
    'no-multiple-empty-lines': 'error',
    semi: ['error', 'never'],
  },
  plugins: {
    '@stylistic/js': stylisticJs,
  },
})
