'use strict';

require('chai').should();
const Hexo = require('hexo');
const cheerio = require('cheerio');
const { encodeURL, full_url_for } = require('hexo-util');
const p = require('./parse');

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

  require('../node_modules/hexo/dist/plugins/helper')(hexo);

  let locals = {};

  before(async () => {
    await Post.insert([
      {source: 'foo', slug: 'foo', content: '<h6>TestHTML</h6>', date: 1e8},
      {source: 'bar', slug: 'bar', date: 1e8 + 1},
      {source: 'baz', slug: 'baz', title: 'With Image', image: 'test.png', date: 1e8 - 1},
      {source: 'date', slug: 'date', title: 'date', date: 1e8 - 2, updated: undefined},
      {source: 'updated', slug: 'updated', title: 'updated', date: 1e8 - 2, updated: 1e8 + 10},
      {source: 'description', slug: 'description', title: 'description', description: '<h6>description</h6>', date: 1e8},
      {source: 'intro', slug: 'intro', title: 'intro', intro: '<h6>intro</h6>', date: 1e8},
      {source: 'excerpt', slug: 'excerpt', title: 'excerpt', excerpt: '<h6>excerpt</h6>', date: 1e8},
      {
        source: 'delim-test',
        slug: 'delim-test',
        title: 'Delimiter Test',
        content: 'This is the beginning.<!-- more -->This is after delimiter.',
        date: 1e8
      },
      {
        source: 'no-delim-test',
        slug: 'no-delim-test',
        title: 'No Delimiter Test',
        content: 'This content has no delimiter and should be truncated at content_limit.',
        date: 1e8
      }
    ]);
    locals = hexo.locals.toObject();
  });

  it('type = atom', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');

    // Verify generated valid Atom XML
    result.data.should.match(/^<\?xml version="1\.0" encoding="utf-8"\?>/);
    result.data.should.include('<feed xmlns="http://www.w3.org/2005/Atom">');
    result.data.should.include('<title>Hexo</title>');
    result.data.should.include('<link rel="self" href="http://localhost/atom.xml"/>');
    result.data.should.include('<generator>Hexo</generator>');

    // Verify feed parser can parse correctly
    const atom = await p(result.data);
    atom.title.should.eql('Hexo');
    atom.items.should.have.length(3);
  });

  it('type = atom (subfolder)', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfigSubfolder);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');

    // Verify subdirectory URL handling is correct
    result.data.should.include('<link rel="self" href="http://localhost/blog/atom.xml"/>');
    result.data.should.include('<id>http://localhost/blog/</id>');

    const atom = await p(result.data);
    atom.title.should.eql('Hexo');
    atom.items.should.have.length(3);
  });

  it('type = rss2', async () => {
    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      limit: 3
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('rss2.xml');

    // Verify generated valid RSS2 XML
    result.data.should.match(/^<\?xml version="1\.0" encoding="utf-8"\?>/);
    result.data.should.include('<rss version="2.0"');
    result.data.should.include('<title>Hexo</title>');
    result.data.should.include('<generator>Hexo</generator>');

    const rss = await p(result.data);
    rss.title.should.eql('Hexo');
    rss.items.should.have.length(3);
  });

  it('limit = 0', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      limit: 0
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    result.path.should.eql('atom.xml');

    // Verify all articles are shown when no limit is set
    const atom = await p(result.data);
    atom.items.should.have.length(Post.length); // All articles
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

    const checkURL = async function(root, domain, validSiteUrl) {
      hexo.config.url = domain;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      const atom = await p(result.data);
      // In modern feed implementation, link usually points to the site, not the feed file
      atom.link.should.eql(validSiteUrl);
      // Check that the generated XML contains correctly encoded self link
      result.data.should.include(`href="${validSiteUrl}${file}"`);
    };

    await checkURL('/', 'http://example.com', 'http://example.com/');

    await checkURL('blo g/', 'http://example.com/blo%20g', 'http://example.com/blo%20g/');
  });

  it('Prints an enclosure on `image` metadata', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };

    const checkURL = async function(url, root) {
      hexo.config.url = url;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      const { items } = await p(result.data);
      const [postImg] = items.filter(({ image }) => image.length);
      postImg.image.length.should.not.eql(0);
    };

    await checkURL('http://localhost/', '/');

    hexo.config.feed = {
      type: 'rss2',
      path: 'rss2.xml',
      content: true
    };

    // RSS should use enclosure tags
    const checkRSSURL = async function(url, root) {
      hexo.config.url = url;
      hexo.config.root = root;

      const feedCfg = hexo.config.feed;
      const result = generator(locals, feedCfg.type, feedCfg.path);

      result.data.should.include('<enclosure url=');
      result.data.should.include('test.png');
    };

    await checkRSSURL('http://localhost/', '/');
  });

  it('Image should have full link', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    // Check generated XML contains complete image URL
    const expectedImageUrl = full_url_for.call(hexo, 'test.png');
    result.data.should.include(expectedImageUrl);
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

  it.skip('custom template', () => {
    // TODO: Re-implement custom template support
  });

  it('no updated date', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    const { items } = await p(result.data);
    const post = items.filter(({ title }) => title === 'date');
    const { date, updated } = post[0];

    updated.should.eql(date);
  });

  it('updated date', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    const { items } = await p(result.data);
    const post = items.filter(({ title }) => title === 'updated');
    const { date, updated } = post[0];
    const expected = new Date(1e8 + 10).toISOString();

    updated.should.eql(expected);
    date.should.not.eql(updated);
  });

  it('Support description, intro and excerpt', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const result = generator(locals, feedCfg.type, feedCfg.path);

    const { items } = await p(result.data);
    for (const key of ['description', 'intro', 'excerpt']) {
      const post = items.filter(({ title }) => title === key);
      post.length.should.eql(1, `Post with title "${key}" should exist`);
      const { description } = post[0];
      const expected = `<h6>${key}</h6>`;

      description.should.eql(expected);
    }
  });

  it('content_limit_delim - delimiter found', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      content_limit: 100,
      content_limit_delim: '<!-- more -->'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const updatedLocals = hexo.locals.toObject();
    const result = generator(updatedLocals, feedCfg.type, feedCfg.path);

    const { items } = await p(result.data);
    const post = items.filter(({ title }) => title === 'Delimiter Test');
    post.length.should.eql(1);
    const { description } = post[0];

    // Should only include content before the delimiter
    description.should.eql('This is the beginning.');
  });

  it('content_limit_delim - delimiter not found', async () => {
    hexo.config.feed = {
      type: 'atom',
      path: 'atom.xml',
      content_limit: 29,
      content_limit_delim: '<!-- more -->'
    };
    hexo.config = Object.assign(hexo.config, urlConfig);
    const feedCfg = hexo.config.feed;
    const updatedLocals = hexo.locals.toObject();
    const result = generator(updatedLocals, feedCfg.type, feedCfg.path);

    const { items } = await p(result.data);
    const post = items.filter(({ title }) => title === 'No Delimiter Test');
    post.length.should.eql(1);
    const { description } = post[0];

    // Should be truncated at content_limit since delimiter not found
    description.should.eql('This content has no delimiter');
  });
});

it('No posts', () => {
  const hexo = new Hexo(__dirname, {
    silent: true
  });
  const Post = hexo.model('Post');
  const generator = require('../lib/generator').bind(hexo);

  require('../node_modules/hexo/dist/plugins/helper')(hexo);

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
