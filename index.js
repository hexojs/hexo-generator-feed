/* global hexo */
'use strict';

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
const feedFn = require('./lib/generator');

if (typeof type === 'string') {
  type = type.toLowerCase();

  // Check feed type
  if (type !== 'atom' && type !== 'rss2') {
    type = 'atom';
  }

  config.type = type;

  hexo.extend.generator.register('feed', function(locals) {
    return feedFn.call(hexo, locals, type);
  });
} else {
  type = type.map(str => str.toLowerCase());

  if (type.length === 1) {
    if (type[0] === 'atom') type.push('rss2');
    else type.push('atom');
  }

  config.type = type;

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
