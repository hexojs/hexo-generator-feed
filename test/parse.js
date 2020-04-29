'use strict';

/* !
 * Ported from feed-furious 1.0.0 to support async-ed camaro v4+
 * Licensed MIT (c) 2017 Tuan Anh Tran <https://tuananh.org/>
 * https://github.com/tuananh/feed-furious
 */


const { ready, transform } = require('camaro');

const template = {
  rss: {
    title: 'rss/channel/title',
    link: 'rss/channel/link|rss/channel/atom:link/@href',
    icon: {
      url: 'rss/channel/image/url',
      title: 'rss/channel/image/title',
      link: 'rss/channel/image/link'
    },
    description: 'rss/channel/description',
    language: 'rss/channel/language',
    updated: 'rss/channel/lastBuildDate',
    published: 'rss/channel/pubDate',
    items: ['//item', {
      title: 'title',
      link: 'link',
      description: 'description',
      content: 'content:encoded',
      image: 'enclosure[@type="image"]/@url',
      date: 'pubDate',
      id: 'guid',
      categories: ['category', '.']
    }]
  },
  atom: {
    title: 'feed/title',
    icon: 'feed/icon',
    updated: 'feed/updated',
    link: 'feed/link/@href',
    id: 'feed/id',
    items: ['//entry', {
      id: 'id',
      title: 'title',
      date: 'published',
      description: 'summary',
      content: 'content[@type="html"]',
      image: 'content[@type="image"]/@src',
      link: 'link',
      categories: ['category', '@term']
    }]
  }
};

const detectFeedType = async xml => {
  await ready();
  const sample = await transform(xml, {
    rss: 'rss/channel/title',
    atom: 'feed/title'
  });

  if (sample.rss) return 'rss';
  if (sample.atom) return 'atom';
  throw new Error('unknown feed type');
};

const parseFeed = async xml => {
  await ready();
  const type = await detectFeedType(xml);
  const output = await transform(xml, template[type]);
  return output;
};

module.exports = parseFeed;
