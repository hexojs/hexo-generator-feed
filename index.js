var generator = hexo.extend.generator;

if (generator.register.length === 1){
  generator.register(require('./feed'));
} else {
  generator.register('feed', require('./feed'));
}