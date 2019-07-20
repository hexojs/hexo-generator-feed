/* global hexo */
'use strict';

const pathFn = require('path');

const config = hexo.config.feed = Object.assign({
  type: 'atom',
  limit: 20,
  hub: '',
  content: true,
  content_limit: 140,
  content_limit_delim: '',
  order_by: '-date'
}, hexo.config.feed);

const type = config.type.toLowerCase();

// Check feed type
if (type !== 'atom' && type !== 'rss2') {
  config.type = 'atom';
} else {
  config.type = type;
}

// Set default feed path
if (!config.path) {
  config.path = config.type + '.xml';
}

// Add extension name if don't have
if (!pathFn.extname(config.path)) {
  config.path += '.xml';
}

hexo.extend.generator.register('feed', require('./lib/generator'));
