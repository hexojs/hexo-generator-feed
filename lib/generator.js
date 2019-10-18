'use strict';

const nunjucks = require('nunjucks');
const env = new nunjucks.Environment();
const { extname, join } = require('path');
const { readFileSync } = require('fs');
const { encodeURL, gravatar, full_url_for } = require('hexo-util');

env.addFilter('uriencode', str => {
  return encodeURL(str);
});

env.addFilter('noControlChars', str => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

const atomTmplSrc = join(__dirname, '../atom.xml');
const atomTmpl = nunjucks.compile(readFileSync(atomTmplSrc, 'utf8'), env);
const rss2TmplSrc = join(__dirname, '../rss2.xml');
const rss2Tmpl = nunjucks.compile(readFileSync(rss2TmplSrc, 'utf8'), env);

module.exports = function(locals, type) {
  const config = this.config;
  const feedConfig = config.feed;
  const template = type === 'rss2' ? rss2Tmpl : atomTmpl;
  let path = feedConfig.path ? feedConfig.path : type.concat('.xml');

  if (Array.isArray(path)) {
    path = path[feedConfig.type.indexOf(type)]
  }

  // Add extension name if don't have
  if (!extname(path)) {
    path += '.xml';
  }

  let posts = locals.posts.sort(feedConfig.order_by || '-date');
  posts = posts.filter(post => {
    return post.draft !== true;
  });

  if (feedConfig.limit) posts = posts.limit(feedConfig.limit);

  let url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  let icon = '';
  if (feedConfig.icon) icon = full_url_for.call(this, feedConfig.icon);
  else if (config.email) icon = gravatar(config.email);

  const xml = template.render({
    config,
    url,
    icon,
    posts,
    feed_url: config.root + path
  });

  return {
    path: path,
    data: xml
  };
};
