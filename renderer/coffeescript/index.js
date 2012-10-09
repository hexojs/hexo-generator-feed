var coffee = require('coffee-script'),
  extend = hexo.extend;

extend.renderer.register('coffee', 'js', function(file, content){
  return coffee.compile(content);
}, true);