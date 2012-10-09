var less = require('less'),
  path = require('path'),
  extend = hexo.extend;

extend.renderer.register('less', 'css', function(file, content, callback){
  var parser = new(less.Parser)({
    paths: path.dirname(file).split(path.sep)
  });

  parser.parse(content, function(err, tree){
    if (err) throw err;
    callback(null, tree.toCSS());
  });
});