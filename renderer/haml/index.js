var haml = require('hamljs'),
  extend = hexo.extend;

extend.renderer.register('haml', 'html', function(file, content, locals){
  var options = {locals: locals};
  if (file) options.filename = file;

  return haml.render(content, locals);
}, true);