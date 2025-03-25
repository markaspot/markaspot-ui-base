module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2020: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended'
  ],
  rules: {
    'no-console': 'warn',
    'indent': ['error', 2]
  }
};
