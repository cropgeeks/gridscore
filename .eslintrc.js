module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    // 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/no-use-v-if-with-v-for': 'off',
    'template-curly-spacing' : 'off',
    'indent': 'off',
    'no-labels': 'off',
    'vue/multi-word-component-names': 0
  },
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
}
