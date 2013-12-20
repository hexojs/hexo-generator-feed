var extend = hexo.extend,
  util = hexo.util,
  file = util.file,
  migrate = require('./migrate');

extend.migrator.register('json', function(args){
  var source = args._.shift(),
    target = hexo.source_dir + '_posts/';

  if (!source){
    console.log('\nUsage: hexo migrate json <source>\n\nMore info: http://zespia.tw/hexo/docs/migration.html\n');
  } else {
    migrate(file, source, target);
  }
});
