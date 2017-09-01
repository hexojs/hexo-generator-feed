'use strict';

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');
var gravatar = require('hexo/lib/plugins/helper/gravatar');

env.addFilter('uriencode', function(str) {
  return encodeURI(str);
});

env.addFilter('noControlChars', function(str) {
  return str.replace(/[\x00-\x1F\x7F]/g, '');
});

var atomTmplSrc = pathFn.join(__dirname, '../atom.xml');
var atomTmpl = nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env);
var rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml');
var rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env);

module.exports = function(locals) {
  var config = this.config;
  var feedConfig = config.feed;
  var template = feedConfig.type === 'rss2' ? rss2Tmpl : atomTmpl;

  var posts = locals.posts.sort('-date');
  posts = posts.filter(function(post) {
    return post.draft !== true;
  });

  if (feedConfig.limit) posts = posts.limit(feedConfig.limit);

  var url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  var icon;
  if (config.email) icon = gravatar(config.email);

  var xml = template.render({
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
