'use strict';

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');

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

  var url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  var authorIds = Object.keys(locals.data.authors);

  var returnData = [];
  for (var i = 0; i < authorIds.length; i++) {
    var authorId = authorIds[i];
    var author = locals.data.authors[authorId];
    var authorPosts = posts.filter(function(post) {
      return post.authorId == authorId;
    });
    if (feedConfig.limit) authorPosts = authorPosts.limit(feedConfig.limit);

    if (authorPosts.length > 0) {
      var xml = template.render({
        config: config,
        url: url,
        posts: authorPosts,
        feed_url: config.root + "feeds/" + authorId,
      	authors: locals.data.authors
      });
      returnData.push(
        {
          path: "feeds/" + authorId + ".xml",
          data: xml
        }
      );
    }
  }

  return returnData;

};
