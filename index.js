/* global hexo */
'use strict';

const { extname } = require('path');

const config = hexo.config.feed = Object.assign({
  type: 'atom',
  limit: 20,
  hub: '',
  content: true,
  content_limit: 140,
  content_limit_delim: '',
  order_by: '-date',
  autodiscovery: true
}, hexo.config.feed);

let type = config.type;
let path = config.path;
const feedFn = require('./lib/generator');

if (!type || typeof type === 'string') {
  if (!type) type = 'atom';

  // Check feed type
  if (type !== 'atom' && type !== 'rss2') {
    type = 'atom';
  }

  if (!path || typeof path !== 'string') path = type.concat('.xml');

  // Add extension name if not found
  if (!extname(path)) {
    path += '.xml';
  }

  config.type = type;
  config.path = path;

  hexo.extend.generator.register('feed', function(locals) {
    return feedFn.call(hexo, locals);
  });
} else {
  if (!type) type = ['atom', 'rss2'];

  if (!Array.isArray(type)) type = ['atom', 'rss2'];
  else if (!type.includes('atom') || !type.includes('rss2')
    || type.length !== 2) {
    type = ['atom', 'rss2'];
  }

  if (!path) path = type.map(str => str.concat('.xml'));

  if (!Array.isArray(path) || path.length !== 2) {
    path = type.map(str => str.concat('.xml'));
  }

  path = path.map(str => {
    if (!extname(str)) return str.concat('.xml');
    return str;
  });

  config.type = type;
  config.path = path;

  hexo.extend.generator.register('feed1', function(locals) {
    return feedFn.call(hexo, locals, type[0]);
  });

  hexo.extend.generator.register('feed2', function(locals) {
    return feedFn.call(hexo, locals, type[1]);
  });
}

if (config.autodiscovery === true) {
  hexo.extend.filter.register('after_render:html', require('./lib/autodiscovery'));
}
