'use strict';

const { extname } = require('path');
const { url_for } = require('hexo-util');

function autodiscoveryInject(data) {
  const { config } = this;
  const { feed } = config;
  let type = feed.type;
  let path = feed.path
  let autodiscoveryTag;

  if (typeof feed.autodiscovery === 'undefined') feed.autodiscovery = true;

  if (feed.autodiscovery === false
    || data.match(/type=['|"]?application\/(atom|rss)\+xml['|"]?/i)) return;

  if (!type || typeof type === 'string') {
    if (!type) type = 'atom';

    if (type !== 'atom' && type !== 'rss2') {
      type = 'atom';
    }

    if (!path || typeof path !== 'string') path = type.concat('.xml');

    if (!extname(path)) {
      path += '.xml';
    }

    type = type.replace(/2$/, '');
    autodiscoveryTag = `<link rel="alternate" href="${url_for.call(this, path)}" title="${config.title}" type="application/${type}+xml">`;
  } else {
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

    type = type.map(str => str.replace(/2$/, ''));

    autodiscoveryTag = `<link rel="alternate" href="${url_for.call(this, path[0])}" title="${config.title}" type="application/${type[0]}+xml">`;
    autodiscoveryTag += `\n<link rel="alternate" href="${url_for.call(this, path[1])}" title="${config.title}" type="application/${type[1]}+xml">`;
  }

  return data.replace(/<head>(?!<\/head>).+?<\/head>/s, (str) => str.replace('</head>', `${autodiscoveryTag}</head>`));
}

module.exports = autodiscoveryInject;
