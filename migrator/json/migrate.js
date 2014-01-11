var path = require('path'),
  async = require('async'),
  moment = require('moment'),
  request = require('request'),
  tomd = require('to-markdown').toMarkdown;

module.exports = function(file, source, target){
  async.waterfall([
    function(next){
      console.log('Fetching %s.', source);

      // URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
      if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/)){
        request.get(source, next);
      } else {
        next(null, require('./' + source));
      }
    },
    function(data, next){
      console.log('Analyzing.');

      var posts = data.feed.entry;

      async.forEach(posts, function(item, next){
        var title = item.title['$t'];
        var published = item.published['$t'];
        var link = item.link;
        var tags = '';
        link = link[link.length - 1].href;

        var postLink = path.basename(link.split('/').reverse()[0], '.html');
        if (!postLink) {
          postLink = title.toLowerCase().split(' ').join('-');
        }

        if (item.category) {
          tags = item.category.map(prop('term'));
        }

        var content = [
          'title: ' + title,
          'date: ' + moment(published).format('YYYY-MM-DD HH:mm:ss'),
          'tags: ' + tags,
          '---',
        ];
        var description = item.content['$t'];

        file.write(target + postLink + '.md', content.join('\n') + '\n\n' + tomd(description), next);
      }, function(){
        next(null, posts.length);
      });
    }
  ], function(err, length){
    if (err) throw err;
    console.log('%d posts migrated.', length);
  });
};

function prop(attr) {
  return function(k) {
    return k[attr];
  };
}
