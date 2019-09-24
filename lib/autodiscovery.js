'use strict';

function autodiscoveryInject(data) {
  const { config } = this;
  const { feed } = config;
  const type = feed.type.replace(/2$/, '');

  if (!feed.autodiscovery
    || data.match(/type=['|"]?application\/(atom|rss)\+xml['|"]?/i)) return;

  const autodiscoveryTag = `<link rel="alternate" href="${feed.path}" title="${config.title}" type="application/${type}+xml">`;

  return data.replace(/<head>(?!<\/head>).+?<\/head>/, (str) => str.replace('</head>', `${autodiscoveryTag}</head>`));
}

module.exports = autodiscoveryInject;
