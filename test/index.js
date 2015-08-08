var should = require('chai').should();
var Hexo = require('hexo');
var ejs = require('ejs');
var pathFn = require('path');
var fs = require('fs');
var assign = require('object-assign');
var cheerio = require('cheerio');

ejs.filters.cdata = function(str){
  return str ? '<![CDATA[' + str + ']]>' : '';
};

var atomTmplSrc = pathFn.join(__dirname, '../atom.ejs');
var atomTmpl = ejs.compile(fs.readFileSync(atomTmplSrc, 'utf8'));
var rss2TmplSrc = pathFn.join(__dirname, '../rss2.ejs');
var rss2Tmpl = ejs.compile(fs.readFileSync(rss2TmplSrc, 'utf8'));

var urlConfig = {
  url:  'http://localhost/',
  root: '/'
};

describe('Feed generator', function(){
  var hexo = new Hexo(__dirname, {silent: true});
  var Post = hexo.model('Post');
  var generator = require('../lib/generator').bind(hexo);
  var posts;
  var locals;

  before(function(){
    return Post.insert([
      {source: 'foo', slug: 'foo', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', date: 1e8 - 1}
    ]).then(function(data){
      posts = Post.sort('-date');
      locals = hexo.locals.toObject();
    });
  });

  it('type = atom', function(){
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 2
    };
    hexo.config = assign(hexo.config, urlConfig);
    var result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl({
      config: hexo.config,
      url: urlConfig.url,
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
    hexo.config = assign(hexo.config, urlConfig);
    var result = generator(locals);

    result.path.should.eql('rss2.xml');
    result.data.should.eql(rss2Tmpl({
      config: hexo.config,
      url: urlConfig.url,
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
    hexo.config = assign(hexo.config, urlConfig);

    var result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts,
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('Relative URL handling', function(){
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    var checkURL = function(root, path, valid){
      hexo.config.url = root;
      hexo.config.path = path;

      var result = generator(locals);
      var $ = cheerio.load(result.data);

      $('feed>id').text().should.eql(valid);
      $('feed>entry>link').attr('href').should.eql(valid);
    }

    checkURL('http://localhost/', '/', 'http://localhost/');

    var GOOD = 'http://localhost/blog/';

    checkURL('http://localhost/blog',   '/blog/', GOOD);
    checkURL('http://localhost/blog',   '/blog',  GOOD);
    checkURL('http://localhost/blog/',  '/blog/', GOOD);
    checkURL('http://localhost/blog/',  '/blog',  GOOD);

    checkURL('http://localhost/b/l/o/g', '/', 'http://localhost/b/l/o/g/');

  });
});