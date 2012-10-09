var jade = require('jade'),
  extend = hexo.extend;

extend.renderer.register('jade', 'html', function(file, content, locals){
  var options = {};
  if (file) options.filename = file;

  var fn = jade.compile(content, options);
  return fn(locals);
}, true);