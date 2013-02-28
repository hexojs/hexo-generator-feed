var haml = require('hamljs');

hexo.extend.renderer.register('haml', 'html', function(data, locals){
  return haml.render(data.text, locals);
}, true);