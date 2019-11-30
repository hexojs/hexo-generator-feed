/* global hexo */
'use strict';

const { extname, join } = require('path');

hexo.config.feed = Object.assign({
  type: 'atom',
  limit: 20,
  hub: '',
  content: true,
  content_limit: 140,
  content_limit_delim: '',
  order_by: '-date',
  autodiscovery: true,
  template: ''
}, hexo.config.feed);

const config = hexo.config.feed;

let type = config.type;
let path = config.path;
let template = config.template;
const feedFn = require('./lib/generator');

if (!type || (typeof type !== 'string' && !Array.isArray(type))) {
  type = 'atom';
}

if (Array.isArray(type)) {
  if (type.length > 2) type = type.slice(0, 2);
  switch (type.length) {
    case 0:
      type = 'atom';
      break;
    case 1:
      if (type[0] !== 'atom' && type[0] !== 'rss2') {
        type = 'atom';
      }
      break;
    case 2:
      if (type !== ['atom', 'rss2'] && type !== ['rss2', 'atom']) {
        type = ['atom', 'rss2'];
      }
      break;
  }
}

if (typeof type === 'string') {
  if (type !== 'atom' && type !== 'rss2') type = 'atom';
}

if (!path || typeof path !== typeof type) {
  if (typeof type === 'string') path = type.concat('.xml');
  else path = type.map(str => str.concat('.xml'));
}

if (Array.isArray(path)) {
  if (path.length !== type.length) {
    if (path.length > type.length) path = path.slice(0, type.length);
    else if (path.length === 0) path = type.map(str => str.concat('.xml'));
    else path.push(type[1].concat('.xml'));
  }

  path = path.map(str => {
    if (!extname(str)) return str.concat('.xml');
    return str;
  });
}

if (typeof path === 'string') {
  if (!extname(path)) path += '.xml';
}

if (typeof template !== 'string' && !Array.isArray(template)) {
  template = null;
}

if (Array.isArray(template)) {
  if (template.length >= 1) {
    if (template.length > type.length) template = template.slice(0, type.length);
    else if (template.length < type.length) template.push(join(__dirname, `${type[1]}.xml`));
  } else {
    template = null;
  }
}

config.type = type;
config.path = path;
config.template = template;

if (typeof type === 'string') {
  hexo.extend.generator.register(type, locals => {
    return feedFn.call(hexo, locals, type, path);
  });
} else {
  for (const feedType of type) {
    hexo.extend.generator.register(feedType, locals => {
      return feedFn.call(hexo, locals, feedType, path[type.indexOf(feedType)]);
    });
  }
}

if (typeof config.autodiscovery !== 'boolean') config.autodiscovery = true;

if (config.autodiscovery === true) {
  hexo.extend.filter.register('after_render:html', require('./lib/autodiscovery'));
}
