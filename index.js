/* global hexo */
'use strict';

var assign = require('object-assign');
var pathFn = require('path');

var config = hexo.config.feed = assign({
  type: 'atom',
  limit: 20,
  hub: '',
  content: true
}, hexo.config.feed);

var type = config.type.toLowerCase();

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

// Set itunes feed path
if (!config.itunespath) {
  config.itunespath = 'itunes.xml'
}

// Add extension name if don't have
if (!pathFn.extname(config.path)) {
  config.path += '.xml';
}


hexo.extend.generator.register('feed', require('./lib/generator'));
hexo.extend.generator.register('authorfeed', require('./lib/generator-author'));
hexo.extend.generator.register('itunesfeed', require('./lib/itunesgenerator'));
