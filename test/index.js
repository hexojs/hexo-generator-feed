'use strict';

var should = require('chai').should(); // eslint-disable-line
var Hexo = require('hexo');
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');
var cheerio = require('cheerio');

env.addFilter('uriencode', function(str) {
  return encodeURI(str);
});

env.addFilter('noControlChars', function(str) {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

var atomTmplSrc = pathFn.join(__dirname, '../atom.xml');
var atomTmpl = nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env);
var rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml');
var rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env);

var urlConfig = {
  url: 'http://localhost/',
  root: '/'
};

describe('Feed generator', function() {
  var hexo = new Hexo(__dirname, {
    silent: true
  });
  var Post = hexo.model('Post');
  var generator = require('../lib/generator').bind(hexo);

  require('../node_modules/hexo/lib/plugins/helper')(hexo);

  var posts,
    locals;

  before(function() {
    return Post.insert([
      {source: 'foo', slug: 'foo', content: '<h6>TestHTML</h6>', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', title: 'With Image', image: 'test.png', date: 1e8 - 1}
    ]).then(function(data) {
      posts = Post.sort('-date');
      locals = hexo.locals.toObject();
    });
  });

  it('type = atom', function() {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    var result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts.limit(3),
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('type = rss2', function() {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    var result = generator(locals);

    result.path.should.eql('rss2.xml');
    result.data.should.eql(rss2Tmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts.limit(3),
      feed_url: hexo.config.root + 'rss2.xml'
    }));
  });

  it('limit = 0', function() {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 0
    };
    hexo.config = Object.assign(hexo.config, urlConfig);

    var result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts,
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('Preserves HTML in the content field', function() {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };
    var result = generator(locals);
    var $ = cheerio.load(result.data, {xmlMode: true});

    var description = $('content\\:encoded').html()
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '');

    description.should.be.equal('<h6>TestHTML</h6>');

    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      content: true
    };
    result = generator(locals);
    $ = cheerio.load(result.data, {xmlMode: true});
    description = $('content[type="html"]').html()
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '');

    description.should.be.equal('<h6>TestHTML</h6>');

  });

  it('Relative URL handling', function() {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    var checkURL = function(url, root, valid) {
      hexo.config.url = url;
      hexo.config.root = root;

      var result = generator(locals);
      var $ = cheerio.load(result.data);

      $('feed>id').text().should.eql(valid);
      $('feed>entry>link').attr('href').should.eql(valid);
    };

    checkURL('http://localhost/', '/', 'http://localhost/');

    var GOOD = 'http://localhost/blog/';

    checkURL('http://localhost/blog', '/blog/', GOOD);
    checkURL('http://localhost/blog', '/blog', GOOD);
    checkURL('http://localhost/blog/', '/blog/', GOOD);
    checkURL('http://localhost/blog/', '/blog', GOOD);

    checkURL('http://localhost/b/l/o/g', '/', 'http://localhost/b/l/o/g/');

  });

  it('IDN handling', function() {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    var checkURL = function(url, root, valid) {
      hexo.config.url = url;
      hexo.config.root = root;

      var result = generator(locals);
      var $ = cheerio.load(result.data);

      $('feed>id').text().should.eql(valid);
      $('feed>entry>link').attr('href').should.eql(valid);
    };
    var IDN = 'http://gôg.com/';
    checkURL(IDN, '/', IDN);

    checkURL(IDN, 'blo g/', IDN);
  });

  it('Root encoding', function() {
    var file = 'atom.xml';
    hexo.config.feed = {
      type: 'atom',
      path: file
    };

    var domain = 'http://example.com/';

    var checkURL = function(root, valid) {
      hexo.config.url = domain;
      hexo.config.root = root;

      var result = generator(locals);
      var $ = cheerio.load(result.data);

      $('feed>link').attr('href').should.eql(valid);
    };
    checkURL('/', '/' + file);

    checkURL('blo g/', 'blo%20g/' + file);
  });

  it('Prints an enclosure on `image` metadata', function() {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    var checkURL = function(url, root, selector) {
      hexo.config.url = url;
      hexo.config.root = root;

      var result = generator(locals);
      var $ = cheerio.load(result.data);

      $(selector).length.should.eq(1);
    };

    checkURL('http://localhost/', '/', 'feed>entry:nth-of-type(3)>content[type="image"]');

    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };
    checkURL('http://localhost/', '/', 'item:nth-of-type(3)>enclosure');
  });

});
