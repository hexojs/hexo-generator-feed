'use strict';

const { url_for } = require('hexo-util');

function autodiscoveryInject(data) {
  const { config } = this;
  const { feed } = config;
  const type = feed.type.replace(/2$/, '');

  if (!feed.autodiscovery
    || data.match(/type=['|"]?application\/(atom|rss)\+xml['|"]?/i)) return;

  const autodiscoveryTag = `<link rel="alternate" href="${url_for.call(this, feed.path)}" title="${config.title}" type="application/${type}+xml">`;

  return data.replace(/<head>(?!<\/head>).+?<\/head>/s, (str) => str.replace('</head>', `${autodiscoveryTag}</head>`));
}

module.exports = autodiscoveryInject;
