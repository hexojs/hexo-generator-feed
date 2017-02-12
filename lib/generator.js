'use strict';

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');
var hexoutil = require('hexo-util');

env.addFilter('uriencode', function(str) {
  return encodeURI(str);
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
  if (feedConfig.limit) posts = posts.limit(feedConfig.limit);
	
  if (typeof feedConfig.content_limit != 'undefined') {
	  posts.forEach(function(post) {
		  var safe_content = hexoutil.stripHTML(post.content);
		  post.feedShortContent = safe_content.substring(0, feedConfig.content_limit);
		  
		  if (typeof feedConfig.content_limit_delim != 'undefined') {
			var delim_pos = -1;
			for (var ind in feedConfig.content_limit_delim) {
				var delim = feedConfig.content_limit_delim[ind];
				delim_pos = post.feedShortContent.lastIndexOf(delim);
				if (delim_pos > -1) {
					post.feedShortContent = post.feedShortContent.substring(0, delim_pos+1);
					break;
				}
			}
		  }
	  });
  }

  var url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  var xml = template.render({
    config: config,
    url: url,
    posts: posts,
    feed_url: config.root + feedConfig.path
  });

  return {
    path: feedConfig.path,
    data: xml
  };
};
