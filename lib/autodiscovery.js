'use strict';

const { extname } = require('path');
const { url_for } = require('hexo-util');

function autodiscoveryInject(data) {
  const { config } = this;
  const { feed } = config;
  let type = feed.type;
  let autodiscoveryTag, path;

  if (!feed.autodiscovery
    || data.match(/type=['|"]?application\/(atom|rss)\+xml['|"]?/i)) return;

  if (typeof type === 'string') {
    type = type.replace(/2$/, '');
    autodiscoveryTag = `<link rel="alternate" href="${url_for.call(this, feed.path)}" title="${config.title}" type="application/${type}+xml">`;
  } else {
    type = type.map(str => str.toLowerCase());

    if (type.length === 1) {
      if (type[0] === 'atom') type.push('rss');
      else if (type[0] === 'rss2') type.push('atom');
      else {
        type[0] = 'atom';
        type.push('rss');
      }
    }

    if (!path) path = type.map(str => str.concat('.xml'));

    if (typeof path === 'string') path = [path];

    if (path.length === 1) {
      if (path[0].toLowerCase().includes('atom')) path.push('rss2.xml');
      else path.push('atom.xml');
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
