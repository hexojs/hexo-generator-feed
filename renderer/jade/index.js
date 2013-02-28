var jade = require('jade');

hexo.extend.renderer.register('jade', 'html', function(data, locals){
  return jade.compile(data.text, {filename: data.path})(locals);
}, true);