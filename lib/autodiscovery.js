'use strict';

const { url_for } = require('hexo-util');

function autodiscoveryInject(data) {
  const { config } = this;
  const { feed } = config;
  const { path, type } = feed;
  let autodiscoveryTag = '';

  if (data.match(/type=['|"]?application\/(atom|rss)\+xml['|"]?/i) || feed.autodiscovery === false) return;

  if (typeof type === 'string') {
    autodiscoveryTag += `<link rel="alternate" href="${url_for.call(this, path)}" `
      + `title="${config.title}" type="application/${type.replace(/2$/, '')}+xml">\n`;
  } else {
    type.forEach((feedType, i) => {
      autodiscoveryTag += `<link rel="alternate" href="${url_for.call(this, path[i])}" `
        + `title="${config.title}" type="application/${feedType.replace(/2$/, '')}+xml">\n`;
    });
  }

  return data.replace(/<head>(?!<\/head>).+?<\/head>/s, (str) => str.replace('</head>', `${autodiscoveryTag}</head>`));
}

module.exports = autodiscoveryInject;
