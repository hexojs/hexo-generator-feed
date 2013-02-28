var coffee = require('coffee-script');

hexo.extend.renderer.register('coffee', 'js', function(data, options){
  return coffee.compile(data.text);
}, true);