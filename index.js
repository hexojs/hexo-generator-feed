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

if (typeof type === 'string') type = [type];

if (!type || !Array.isArray(type)) {
  type = ['atom'];
}

if (Array.isArray(type) && type.length > 2) {
  type = type.slice(0, 2);
}

type = type.map((str, i) => {
  str = str.toLowerCase();
  if (str !== 'atom' && str !== 'rss2') {
    if (i === 0) str = 'atom';
    else str = 'rss2';
  }
  return str;
});

if (!path || typeof path === 'string' || !Array.isArray(path)) {
  path = type.map(str => str.concat('.xml'));
}

if (Array.isArray(path) && path.length > 2) {
  path = path.slice(0, 2);
}

path = path.map(str => {
  if (!extname(str)) return str.concat('.xml');
  return str;
});

config.type = type;
config.path = path;

for (const feedType of type) {
  hexo.extend.generator.register(feedType, locals => {
    return feedFn.call(hexo, locals, feedType, path[type.indexOf(feedType)]);
  });
}

if (typeof config.autodiscovery === 'undefined') config.autodiscovery = true;

if (config.autodiscovery === true) {
  hexo.extend.filter.register('after_render:html', require('./lib/autodiscovery'));
}
