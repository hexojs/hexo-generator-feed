var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');
var moment = require('moment');

nunjucks.configure({
  autoescape: false,
  watch: false
});

env.addFilter('uriencode', function(str) {
  return encodeURI(str);
});

var itunesTmplSrc = pathFn.join(__dirname, '../itunes.xml');
var itunesTmpl = nunjucks.compile(fs.readFileSync(itunesTmplSrc, 'utf8'), env);

module.exports = function(locals) {
  var config = this.config;
  var feedConfig = config.feed;
  var template = itunesTmpl;

  var category = locals.categories.findOne({'name': 'podcasts'});
  var podcasts = category.posts.sort('-date');
  
  var url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  var xml = template.render({
    config: config,
    url: url,
    podcasts: podcasts.data,
    feed_url: config.root + feedConfig.itunespath,
	authors: locals.data.authors,
	pubDate: moment(),
	updatedDate: moment()
  });

  return {
    path: feedConfig.itunespath,
    data: xml
  };
};
