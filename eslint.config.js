'use strict';

const config = require('eslint-config-hexo/eslint');
const testConfig = require('eslint-config-hexo/test');

module.exports = [
  // Configurations applied globally
  ...config,
  // Configurations applied only to test files
  ...testConfig.map(config => ({
    ...config,
    files: ['test/**/*.js']
  }))
];
