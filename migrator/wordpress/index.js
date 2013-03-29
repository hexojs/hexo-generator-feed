var extend = hexo.extend,
  util = hexo.util,
  file = util.file,
  sourceDir = hexo.source_dir,
  xml2js = require('xml2js'),
  parser = new xml2js.Parser(),
  request = require('request'),
  async = require('async'),
  _ = require('underscore'),
  tomd = require('to-markdown').toMarkdown;

extend.migrator.register('wordpress', function(args){
  var source = args._.shift();

  if (!source) return console.log('\nUsage: hexo migrate wordpress <source>\n\nMore info: http://zespia.tw/hexo/docs/migrate.html\n');

  async.waterfall([
    function(next){
      console.log('Fetching %s.', source);

      // URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
      if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/)){
        request(source, function(err, res, body){
          if (err) throw err;
          if (res.statusCode == 200) next(null, body);
        });
      } else {
        file.read(source, next);
      }
    },
    function(data, next){
      console.log('Parsing XML.');
      parser.parseString(data, next);
    },
    function(data, next){
      console.log('Analyzing.');

      var length = 0,
        arr = data.rss.channel[0].item;

      async.forEach(arr, function(item, next){
        var postTitle = item.title[0],
          id = item['wp:post_id'][0],
          postDate = item['wp:post_date'][0],
          postLink = item['wp:post_name'][0],
          postContent = item['content:encoded'][0],
          postComment = item['wp:comment_status'][0] === 'open' ? true : false;

        if (_.isObject(postTitle)) postTitle = '';
        if (!postLink || _.isObject(postLink)) {
          if (postTitle)
            postLink = postTitle.toLowerCase().split(' ').join('-');
          else {
            // Have to use post_id if both title and post_name are empty
            postLink = item['wp:post_id'][0];
          }
        }

        postContent = _.isObject(postContent) ? '' : tomd(postContent);
        postContent = postContent.replace(/\r\n/g, '\n');

        switch (item['wp:post_type'][0]){
          case 'post':
            length++;

            var postStatus = item['wp:status'][0] === 'publish' ? '_posts/' : '_drafts/',
              cats = item.category,
              categories = [],
              postTag = [];

            _.each(cats, function(item){
              if (!_.isString(item)){
                switch(item.$.domain){
                  case 'post_tag':
                    postTag.push(item._);
                    break;
                  case 'category':
                    categories.push(item._);
                    break;
                }
              }
            });

            if (postTag.length) postTag = '\n- ' + _.uniq(postTag).join('\n- ');
            if (categories.length) categories = '\n- ' + _.uniq(categories).join('\n- ');

            var content = [
              'title: "' + postTitle.replace(/"/g, '\\"') + '"',
              'id: ' + id,
              'date: ' + postDate,
              'tags: ' + (postTag ? postTag : ''),
              'categories: ' + (categories || 'uncategory'),
              '---'
            ];

            file.write(sourceDir + postStatus + decodeURIComponent(postLink) + '.md', content.join('\n') + '\n\n' + postContent, next);
            break;

          case 'page':
            length++;

            var content = [
              'title: ' + postTitle,
              'date: ' + postDate,
              '---'
            ];

            file.write(sourceDir + postLink + '/index.md', content.join('\n') + '\n\n' + postContent, next);
            break;

          default:
            next();
        }
      }, function(err){
        if (err) throw err;
        next(null, length);
      });
    }
  ], function(err, length){
    if (err) throw err;
    console.log('%d posts migrated.', length);
  });
});
