module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Customize rules based on project needs
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'max-len': ['error', { code: 120 }],
    'comma-dangle': ['error', 'always-multiline'],
    'no-param-reassign': ['error', { props: false }],
    'no-use-before-define': ['error', { functions: false }],
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    'class-methods-use-this': 'off',
    // Reduce complexity warnings
    complexity: ['warn', { max: 8 }],
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
