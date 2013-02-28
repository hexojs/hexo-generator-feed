var less = require('less'),
  path = require('path');

hexo.extend.renderer.register('less', 'css', function(data, options, callback){
  var parser = new(less.Parser)({
    paths: path.dirname(data.path).split('/'),
    filename: path.basename(data.path)
  });

  parser.parse(data.text, function(err, tree){
    if (err) return callback(err);
    callback(null, tree.toCSS(options));
  });
});