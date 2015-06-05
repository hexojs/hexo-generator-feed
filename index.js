var assign = require('object-assign');
var pathFn = require('path');

var config = hexo.config.feed = assign({
  type: 'atom',
  limit: 20
}, hexo.config.feed);

var type = config.type.toLowerCase();

// Check feed type
if (type !== 'atom' && type !== 'rss2'){
  config.type = 'atom';
} else {
  config.type = type;
}

// Set default feed path
if (!config.path){
  config.path = config.type + '.xml';
}

// Add extension name if don't have
if (!pathFn.extname(config.path)){
  config.path += '.xml';
}

hexo.extend.generator.register('feed', require('./lib/generator'));