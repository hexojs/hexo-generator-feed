var should = require('chai').should();
var Hexo = require('hexo');
var ejs = require('ejs');
var pathFn = require('path');
var fs = require('fs');

ejs.filters.cdata = function(str){
  return str ? '<![CDATA[' + str + ']]>' : '';
};

var atomTmplSrc = pathFn.join(__dirname, '../atom.ejs');
var atomTmpl = ejs.compile(fs.readFileSync(atomTmplSrc, 'utf8'));
var rss2TmplSrc = pathFn.join(__dirname, '../rss2.ejs');
var rss2Tmpl = ejs.compile(fs.readFileSync(rss2TmplSrc, 'utf8'));

describe('Feed generator', function(){
  var hexo = new Hexo(__dirname, {silent: true});
  var Post = hexo.model('Post');
  var generator = require('../lib/generator').bind(hexo);
  var posts;

  before(function(){
    return Post.insert([
      {source: 'foo', slug: 'foo', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', date: 1e8 - 1}
    ]).then(function(data){
      posts = Post.sort('-date');
    });
  });

  it('type = atom', function(){
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 2
    };

    var result = generator(hexo.locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl({
      config: hexo.config,
      posts: posts.limit(2),
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('type = rss2', function(){
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      limit: 2
    };

    var result = generator(hexo.locals);

    result.path.should.eql('rss2.xml');
    result.data.should.eql(rss2Tmpl({
      config: hexo.config,
      posts: posts.limit(2),
      feed_url: hexo.config.root + 'rss2.xml'
    }));
  });

  it('limit = 0', function(){
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 0
    };

    var result = generator(hexo.locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl({
      config: hexo.config,
      posts: posts,
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });
});