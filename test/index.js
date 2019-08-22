'use strict';

const should = require('chai').should(); // eslint-disable-line
const Hexo = require('hexo');
const nunjucks = require('nunjucks');
const env = new nunjucks.Environment();
const pathFn = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const urlFn = require('url');

env.addFilter('uriencode', str => {
  return encodeURI(str);
});

env.addFilter('noControlChars', str => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

env.addFilter('urlencode', str => {
  return urlFn.format({
    protocol: urlFn.parse(str).protocol,
    hostname: urlFn.parse(str).hostname,
    pathname: encodeURI(urlFn.parse(str).pathname)
  });
});

const atomTmplSrc = pathFn.join(__dirname, '../atom.xml');
const atomTmpl = nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env);
const rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml');
const rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env);

const urlConfig = {
  url: 'http://localhost/',
  root: '/'
};

describe('Feed generator', () => {
  const hexo = new Hexo(__dirname, {
    silent: true
  });
  const Post = hexo.model('Post');
  const generator = require('../lib/generator').bind(hexo);

  require('../node_modules/hexo/lib/plugins/helper')(hexo);

  let posts = {};
  let locals = {};

  before(() => {
    return Post.insert([
      {source: 'foo', slug: 'foo', content: '<h6>TestHTML</h6>', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', title: 'With Image', image: 'test.png', date: 1e8 - 1}
    ]).then(data => {
      posts = Post.sort('-date');
      locals = hexo.locals.toObject();
    });
  });

  it('type = atom', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts.limit(3),
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('type = rss2', () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const result = generator(locals);

    result.path.should.eql('rss2.xml');
    result.data.should.eql(rss2Tmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts.limit(3),
      feed_url: hexo.config.root + 'rss2.xml'
    }));
  });

  it('limit = 0', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 0
    };
    hexo.config = Object.assign(hexo.config, urlConfig);

    const result = generator(locals);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: urlConfig.url,
      posts: posts,
      feed_url: hexo.config.root + 'atom.xml'
    }));
  });

  it('Preserves HTML in the content field', () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };
    let result = generator(locals);
    let $ = cheerio.load(result.data, {xmlMode: true});

    let description = $('content\\:encoded').html()
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

  it('Relative URL handling', () => {
    hexo.config.permalink = ':year/';
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = function(url, root, valid) {
      hexo.config.url = url;
      hexo.config.root = root;

      const result = generator(locals);
      const $ = cheerio.load(result.data);

      $('feed>id').text().should.eql(valid);
    };

    checkURL('http://localhost/', '/', 'http://localhost/');

    const GOOD = 'http://localhost/blog/';

    checkURL('http://localhost/blog', '/blog/', GOOD);
    checkURL('http://localhost/blog', '/blog', GOOD);
    checkURL('http://localhost/blog/', '/blog/', GOOD);
    checkURL('http://localhost/blog/', '/blog', GOOD);

    checkURL('http://localhost/b/l/o/g', '/', 'http://localhost/b/l/o/g/');

  });

  it('IDN handling', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = function(url, root) {
      hexo.config.url = url;
      hexo.config.root = root;

      const result = generator(locals);
      const $ = cheerio.load(result.data);

      if (url[url.length - 1] !== '/') url += '/';
      const punyIDN = urlFn.format({
        protocol: urlFn.parse(url).protocol,
        hostname: urlFn.parse(url).hostname,
        pathname: encodeURI(urlFn.parse(url).pathname)
      });

      $('feed>id').text().should.eql(punyIDN);
    };

    it('No root', () => {
      checkURL('http://gôg.com/', '/');
    });

    it('With root', () => {
      checkURL('http://gôg.com/bár', '/bár/');
    });
  });

  it('Root encoding', () => {
    const file = 'atom.xml';
    hexo.config.feed = {
      type: 'atom',
      path: file
    };

    const domain = 'http://example.com/';

    const checkURL = function(root, valid) {
      hexo.config.url = domain;
      hexo.config.root = root;

      const result = generator(locals);
      const $ = cheerio.load(result.data);

      $('feed>link').attr('href').should.eql(valid);
    };
    checkURL('/', '/' + file);

    checkURL('blo g/', 'blo%20g/' + file);
  });

  it('Prints an enclosure on `image` metadata', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = function(url, root, selector) {
      hexo.config.url = url;
      hexo.config.root = root;

      const result = generator(locals);
      const $ = cheerio.load(result.data);

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
