'use strict';

require('chai').should();
const Hexo = require('hexo');
const nunjucks = require('nunjucks');
const env = new nunjucks.Environment();
const { join } = require('path');
const { readFileSync } = require('fs');
const cheerio = require('cheerio');
const { encodeURL } = require('hexo-util');
const p = require('./parse');

env.addFilter('uriencode', str => {
  return encodeURI(str);
});

env.addFilter('noControlChars', str => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
});

const atomTmplSrc = join(__dirname, '../atom.xml');
const atomTmpl = nunjucks.compile(readFileSync(atomTmplSrc, 'utf8'), env);
const rss2TmplSrc = join(__dirname, '../rss2.xml');
const rss2Tmpl = nunjucks.compile(readFileSync(rss2TmplSrc, 'utf8'), env);
const customTmplSrc = join(__dirname, 'custom.xml');
const customTmlp = nunjucks.compile(readFileSync(customTmplSrc, 'utf8'), env);

const urlConfig = {
  url: 'http://localhost',
  root: '/'
};

const urlConfigSubfolder = {
  // subdirectory configuration as per hexo documentation
  url: 'http://localhost/blog',
  root: '/blog/'
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

  before(async () => {
    await Post.insert([
      {source: 'foo', slug: 'foo', content: '<h6>TestHTML</h6>', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', title: 'With Image', image: 'test.png', date: 1e8 - 1}
    ]);
    posts = Post.sort('-date');
    locals = hexo.locals.toObject();
  });

  it('type = atom', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: 'http://localhost/',
      posts: posts.limit(3),
      feed_url: 'http://localhost/atom.xml'
    }));
  });

  it('type = atom (subfolder)', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfigSubfolder);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: 'http://localhost/blog/',
      posts: posts.limit(3),
      feed_url: 'http://localhost/blog/atom.xml'
    }));
  });

  it('type = rss2', () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('rss2.xml');
    result.data.should.eql(rss2Tmpl.render({
      config: hexo.config,
      url: 'http://localhost/',
      posts: posts.limit(3),
      feed_url: 'http://localhost/rss2.xml'
    }));
  });

  it('limit = 0', () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 0
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');
    result.data.should.eql(atomTmpl.render({
      config: hexo.config,
      url: 'http://localhost/',
      posts: posts,
      feed_url: 'http://localhost/atom.xml'
    }));
  });

  it('Preserves HTML in the content field - atom', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      content: true
    };
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const atom = await p(result.data);

    atom.items[1].description.includes('<h6>TestHTML</h6>').should.eql(true);
  });

  it('Preserves HTML in the content field - rss2', async () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const rss = await p(result.data);

    rss.items[1].description.includes('<h6>TestHTML</h6>').should.eql(true);
  });

  it('Relative URL handling', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = async function(url, root, valid) {
      hexo.config.url = url;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      const atom = await p(result.data);
      atom.id.should.eql(valid);
    };

    await checkURL('http://localhost/', '/', 'http://localhost/');

    const GOOD = 'http://localhost/blog/';

    await checkURL('http://localhost/blog', '/blog/', GOOD);
    await checkURL('http://localhost/blog', '/blog', GOOD);
    await checkURL('http://localhost/blog/', '/blog/', GOOD);
    await checkURL('http://localhost/blog/', '/blog', GOOD);

    await checkURL('http://localhost/b/l/o/g', '/', 'http://localhost/b/l/o/g/');

  });

  it('IDN handling', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = async function(url, root) {
      hexo.config.url = url;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      if (url[url.length - 1] !== '/') url += '/';
      const punyIDN = encodeURL(url);
      const atom = await p(result.data);
      atom.id.should.eql(punyIDN);
    };

    await checkURL('http://gôg.com/', '/');

    await checkURL('http://gôg.com/bár', '/bár/');
  });

  it('Root encoding', async () => {
    const file = 'atom.xml';
    hexo.config.feed = {
      type: 'atom',
      path: file
    };

    const checkURL = async function(root, domain, valid) {
      hexo.config.url = domain;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      const atom = await p(result.data);
      atom.link.should.eql(valid);
    };

    await checkURL('/', 'http://example.com', 'http://example.com/' + file);

    await checkURL('blo g/', 'http://example.com/blo%20g', 'http://example.com/blo%20g/' + file);
  });

  it('Prints an enclosure on `image` metadata', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = async function(url, root, index) {
      hexo.config.url = url;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      const feed = await p(result.data);
      feed.items[index].image.should.not.eql('');
    };

    await checkURL('http://localhost/', '/', 2);

    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };
    await checkURL('http://localhost/', '/', 2);
  });

  it('Icon (atom)', async () => {
    hexo.config.url = 'http://example.com';
    hexo.config.root = '/';

    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      icon: 'icon.svg'
    };

    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const atom = await p(result.data);

    atom.icon.should.eql('http://example.com/icon.svg');
  });

  it('Icon (atom) - no icon', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      icon: undefined
    };

    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const atom = await p(result.data);

    atom.icon.length.should.eql(0);
  });

  it('Icon (rss2)', async () => {
    hexo.config.url = 'http://example.com';
    hexo.config.root = '/';

    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      icon: 'icon.svg'
    };

    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const rss = await p(result.data);

    rss.icon.url.should.eql('http://example.com/icon.svg');
  });

  it('Icon (rss2) - no icon', async () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      icon: undefined
    };

    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const rss = await p(result.data);

    rss.icon.url.length.should.eql(0);
  });

  it('Icon (rss2) - subdirectory', async () => {
    hexo.config.url = 'http://example.com/blog';
    hexo.config.root = '/blog/';

    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      icon: 'icon.svg'
    };

    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);
    const rss = await p(result.data);

    rss.icon.url.should.eql('http://example.com/blog/icon.svg');
  });

  it('path must follow order of type', () => {
    hexo.config.feed = {
      type: ['rss2', 'atom'],
      path: ['rss-awesome.xml', 'atom-awesome.xml']
    };
    hexo.config = Object.assign(hexo.config, urlConfig);

    const feedCfg = hexo.config.feed;
    const rss = generator(locals, feedCfg.type[0], feedCfg.path[0]);
    rss.path.should.eql(hexo.config.feed.path[0]);

    const atom = generator(locals, feedCfg.type[1], feedCfg.path[1]);
    atom.path.should.eql(hexo.config.feed.path[1]);
  });

  it('custom template', () => {
    hexo.config.feed = {
      type: ['atom'],
      path: 'atom.xml',
      template: ['test/custom.xml']
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type[0], feedCfg.path);

    result.data.should.eql(customTmlp.render({
      config: hexo.config,
      url: 'http://localhost/',
      posts,
      feed_url: 'http://localhost/atom.xml'
    }));
  });
});

it('No posts', () => {
  const hexo = new Hexo(__dirname, {
    silent: true
  });
  const Post = hexo.model('Post');
  const generator = require('../lib/generator').bind(hexo);

  require('../node_modules/hexo/lib/plugins/helper')(hexo);

  hexo.config.feed = {
    type: 'atom',
    path: 'atom.xml'
  };
  hexo.config = Object.assign(hexo.config, urlConfig);
  const feedCfg = hexo.config.feed;

  return Post.insert([]).then(data => {
    const locals = hexo.locals.toObject();
    const result = typeof generator(locals, feedCfg.type, feedCfg.path);

    result.should.eql('undefined');
  });
});

describe('Autodiscovery', () => {
  const hexo = new Hexo();
  const autoDiscovery = require('../lib/autodiscovery').bind(hexo);
  hexo.config = {
    title: 'foo',
    root: '/'
  };
  hexo.config.feed = {
    type: ['atom'],
    path: ['atom.xml'],
    autodiscovery: true
  };
  hexo.config = Object.assign(hexo.config, urlConfig);

  it('default', () => {
    const content = '<head><link></head>';
    const result = autoDiscovery(content).trim();

    const $ = cheerio.load(result);
    $('link[type="application/atom+xml"]').length.should.eql(1);
    $('link[type="application/atom+xml"]').attr('href').should.eql(urlConfig.root + hexo.config.feed.path[0]);
    $('link[type="application/atom+xml"]').attr('title').should.eql(hexo.config.title);
  });

  it('default - string', () => {
    hexo.config.feed.type = 'atom';
    hexo.config.feed.path = 'atom.xml';

    const content = '<head><link></head>';
    const result = autoDiscovery(content).trim();

    const $ = cheerio.load(result);
    $('link[type="application/atom+xml"]').length.should.eql(1);
    $('link[type="application/atom+xml"]').attr('href').should.eql(urlConfig.root + hexo.config.feed.path);
    $('link[type="application/atom+xml"]').attr('title').should.eql(hexo.config.title);

    hexo.config.feed.type = ['atom'];
    hexo.config.feed.path = ['atom.xml'];
  });

  it('disable', () => {
    hexo.config.feed.autodiscovery = false;
    const content = '<head><link></head>';
    const result = autoDiscovery(content);

    const resultType = typeof result;
    resultType.should.eql('undefined');

    hexo.config.feed.autodiscovery = true;
  });

  it('prepend root', () => {
    hexo.config.root = '/root/';
    const content = '<head><link></head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[type="application/atom+xml"]').attr('href').should.eql(hexo.config.root + hexo.config.feed.path[0]);

    hexo.config.root = '/';
  });

  it('no duplicate tag', () => {
    const content = '<head><link>'
      + '<link rel="alternate" href="/atom.xml" title="foo" type="application/atom+xml"></head>';
    const result = autoDiscovery(content);

    const resultType = typeof result;
    resultType.should.eql('undefined');
  });

  it('ignore empty head tag', () => {
    const content = '<head></head>'
      + '<head><link></head>'
      + '<head></head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[type="application/atom+xml"]').length.should.eql(1);
  });

  it('apply to first non-empty head tag only', () => {
    const content = '<head></head>'
      + '<head><link></head>'
      + '<head><link></head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[type="application/atom+xml"]').length.should.eql(1);
  });

  it('rss2', () => {
    hexo.config.feed = {
      type: ['rss2'],
      path: ['rss2.xml']
    };
    const content = '<head><link></head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[rel="alternate"]').attr('type').should.eql('application/rss+xml');

    hexo.config.feed = {
      type: ['atom'],
      path: ['atom.xml']
    };
  });

  it('multi-line head tag', () => {
    const content = '<head>\n<link>\n</head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[rel="alternate"]').length.should.eql(1);
  });

  it('atom + rss2', () => {
    hexo.config.feed = {
      type: ['atom', 'rss2'],
      path: ['atom.xml', 'rss2.xml']
    };
    hexo.config = Object.assign(hexo.config, urlConfig);

    const content = '<head><link></head>';
    const result = autoDiscovery(content);

    const $ = cheerio.load(result);
    $('link[rel="alternate"]').length.should.eql(2);
    $('link[rel="alternate"]').eq(0).attr('type').should.eql('application/atom+xml');
    $('link[rel="alternate"]').eq(1).attr('type').should.eql('application/rss+xml');
  });
});
