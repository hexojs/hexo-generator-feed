'use strict';

const { generateRssFeed, generateAtomFeed } = require('feedsmith');
const { gravatar, full_url_for, encodeURL } = require('hexo-util');

function generateRss(config, items, icon, url, feed_url, hub) {
  const atomLinks = [{ href: encodeURL(feed_url), rel: 'self', type: 'application/rss+xml' }];
  if (hub) atomLinks.push({ href: encodeURL(hub), rel: 'hub' });

  return generateRssFeed({
    title: config.title,
    description: config.subtitle || config.description,
    link: encodeURL(url),
    language: config.language || 'en',
    copyright: config.author ? `All rights reserved ${new Date().getFullYear()}, ${config.author}` : undefined,
    generator: 'Hexo',
    lastBuildDate: new Date(),
    image: icon ? { url: icon, title: config.title, link: encodeURL(url) } : undefined,
    atom: { links: atomLinks },
    items: items.map(item => ({
      title: item.title,
      link: item.link,
      guid: { value: item.link, isPermaLink: false },
      description: item.description,
      pubDate: item.pubDate,
      authors: config.author && config.email ? [`${config.email} (${config.author})`] : undefined,
      content: item.content ? { encoded: item.content } : undefined,
      enclosures: item.enclosures,
      categories: item.categories
    }))
  }, { lenient: true });
}

function generateAtom(config, items, icon, url, feed_url, hub) {
  const links = [
    { href: encodeURL(url), rel: 'alternate' },
    { href: encodeURL(feed_url), rel: 'self' }
  ];
  if (hub) links.push({ href: encodeURL(hub), rel: 'hub' });

  return generateAtomFeed({
    title: config.title,
    id: encodeURL(url),
    subtitle: config.subtitle || config.description,
    updated: new Date(),
    links: links,
    generator: { text: 'Hexo' },
    logo: icon || undefined,
    rights: config.author ? `All rights reserved ${new Date().getFullYear()}, ${config.author}` : undefined,
    authors: config.author ? [{ name: config.author, email: config.email, uri: url }] : undefined,
    entries: items.map(item => {
      const links = [
        { href: item.link },
        ...(item.enclosures || []).map(enclosure => ({ href: enclosure.url, rel: 'enclosure' }))
      ];
      return {
        title: item.title,
        id: item.link,
        links: links,
        summary: item.description,
        content: item.content,
        published: item.pubDate,
        updated: item.updatedDate || item.pubDate,
        authors: config.author ? [{ name: config.author, email: config.email, uri: url }] : undefined,
        categories: item.categories ? item.categories.map(cat => ({ term: cat.name, scheme: cat.domain })) : undefined
      };
    })
  }, { lenient: true });
}

module.exports = function(locals, type, path) {
  const { config } = this;
  const { email, feed: feedConfig, url: urlCfg } = config;
  const { icon: iconCfg, limit, order_by, content, content_limit, content_limit_delim, hub } = feedConfig;

  let posts = locals.posts.sort(order_by || '-date');
  posts = posts.filter(post => {
    return post.draft !== true;
  });

  if (posts.length <= 0) {
    feedConfig.autodiscovery = false;
    return;
  }

  if (limit) posts = posts.limit(limit);

  let url = urlCfg;
  if (url[url.length - 1] !== '/') url += '/';

  let icon = '';
  if (iconCfg) icon = full_url_for.call(this, iconCfg);
  else if (email) icon = gravatar(email);

  const feed_url = full_url_for.call(this, path);

  // Process posts into feed items
  const items = posts.toArray().map(post => {
    let description = '';
    let postContent = '';

    // Handle description - use same logic as template
    if (post.description) {
      description = post.description;
    } else if (post.intro) {
      description = post.intro;
    } else if (post.excerpt) {
      description = post.excerpt;
    } else if (post.content) {
      // If no description, extract from content
      const short_content = post.content.substring(0, content_limit || 140);
      if (content_limit_delim) {
        const delim_pos = short_content.lastIndexOf(content_limit_delim);
        if (delim_pos > -1) {
          description = short_content.substring(0, delim_pos);
        } else {
          description = short_content;
        }
      } else {
        description = short_content;
      }
    }

    // Handle full content
    if (content && post.content) {
      // Remove control characters, consistent with noControlChars filter in template
      postContent = post.content.replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex
    }

    // Collect categories and tags
    const categories = [];
    if (post.categories) {
      categories.push(...post.categories.toArray().map(cat => ({ name: cat.name, domain: cat.permalink })));
    }
    if (post.tags) {
      categories.push(...post.tags.toArray().map(tag => ({ name: tag.name, domain: tag.permalink })));
    }

    return {
      title: post.title,
      link: encodeURL(full_url_for.call(this, post.permalink)),
      description: description,
      pubDate: post.date.toDate(),
      updatedDate: post.updated ? post.updated.toDate() : post.date.toDate(),
      content: postContent,
      enclosures: post.image ? [{ url: full_url_for.call(this, post.image) }] : undefined,
      categories: categories
    };
  });

  // Generate corresponding format based on type
  let data;
  switch (type) {
    case 'rss2':
      data = generateRss(config, items, icon, url, feed_url, hub);
      break;
    default:
      data = generateAtom(config, items, icon, url, feed_url, hub);
  }

  return {
    path,
    data
  };
};
