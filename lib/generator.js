'use strict';

const nunjucks = require('nunjucks');
const env = new nunjucks.Environment();
const { join } = require('path');
const { readFileSync } = require('fs');
const { encodeURL, gravatar, full_url_for } = require('hexo-util');

env.addFilter('uriencode', str => {
  return encodeURL(str);
});

env.addFilter('noControlChars', str => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

module.exports = function(locals, type, path) {
  const config = this.config;
  const feedConfig = config.feed;

  let tmplSrc = join(__dirname, `../${type}.xml`);
  if (feedConfig.template) {
    if (typeof feedConfig.template === 'string') tmplSrc = feedConfig.template;
    else tmplSrc = feedConfig.template[feedConfig.type.indexOf(type)];
  }
  const template = nunjucks.compile(readFileSync(tmplSrc, 'utf8'), env);

  let posts = locals.posts.sort(feedConfig.order_by || '-date');
  posts = posts.filter(post => {
    return post.draft !== true;
  });

  if (posts.length <= 0) {
    feedConfig.autodiscovery = false;
    return;
  }

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
    path,
    data: xml
  };
};
