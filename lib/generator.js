'use strict';

const nunjucks = require('nunjucks');
const env = new nunjucks.Environment();
const pathFn = require('path');
const fs = require('fs');
const gravatar = require('hexo/lib/plugins/helper/gravatar'); // eslint-disable-line node/no-unpublished-require

env.addFilter('uriencode', str => {
  return encodeURI(str);
});

env.addFilter('noControlChars', str => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

const atomTmplSrc = pathFn.join(__dirname, '../atom.xml');
const atomTmpl = nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env);
const rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml');
const rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env);

module.exports = function(locals) {
  const config = this.config;
  const feedConfig = config.feed;
  const template = feedConfig.type === 'rss2' ? rss2Tmpl : atomTmpl;

  let posts = locals.posts.sort(feedConfig.order_by || '-date');
  posts = posts.filter(post => {
    return post.draft !== true;
  });

  if (feedConfig.limit) posts = posts.limit(feedConfig.limit);

  let url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  let icon = '';
  if (feedConfig.icon) icon = url + encodeURI(feedConfig.icon);
  else if (config.email) icon = gravatar(config.email);

  const xml = template.render({
    config: config,
    url: url,
    icon: icon,
    posts: posts,
    feed_url: config.root + feedConfig.path
  });

  return {
    path: feedConfig.path,
    data: xml
  };
};
