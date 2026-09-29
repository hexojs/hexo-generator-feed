'use strict';

const { generateRssFeed, generateAtomFeed } = require('feedsmith');
const { gravatar, full_url_for, encodeURL } = require('hexo-util');

// Feed readers render the item content outside of the site, so relative links
// and images have no base to resolve against. Rewrite them against the post
// permalink, leaving absolute, protocol-relative and scheme urls untouched.
function toAbsoluteUrls(html, base, context) {
  if (!html || !base) return html;

  return html.replace(/(\s(?:href|src)=")([^"]+)(")/gi, (match, prefix, link, suffix) => {
    if (link.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(link)) return match;

    try {
      // site-relative links are resolved by hexo, so that a blog published in a
      // subdirectory keeps it; anything else is relative to the post itself
      const absolute = link.startsWith('/')
        ? full_url_for.call(context, link)
        : new URL(link, base).href;

      return prefix + absolute + suffix;
    } catch {
      return match;
    }
  });
}

function composePosts(posts, feedConfig) {
  const { limit, order_by } = feedConfig;

  let processedPosts = posts.sort(order_by || '-date');
  processedPosts = processedPosts.filter(post => post.draft !== true);

  if (limit) processedPosts = processedPosts.limit(limit);

  return processedPosts;
}

function composeFeed(config, path, context, posts) {
  const { feed: feedConfig, url: urlConfig, email } = config;
  const { icon: iconConfig, hub } = feedConfig;

  let url = urlConfig;
  if (url[url.length - 1] !== '/') url += '/';

  let icon = '';
  if (iconConfig) icon = full_url_for.call(context, iconConfig);
  else if (email) icon = gravatar(email);

  const feedUrl = full_url_for.call(context, path);
  const currentYear = new Date().getFullYear();

  return {
    title: config.title,
    description: config.subtitle || config.description,
    url,
    feedUrl,
    icon,
    hub,
    language: config.language,
    author: { name: config.author, email: config.email },
    copyright: config.author && `All rights reserved ${currentYear}, ${config.author}`,
    updated: posts.first().updated ? posts.first().updated.toDate() : posts.first().date.toDate()
  };
}

function composeFeedLinks(feedUrl, hub, type) {
  const links = [{ href: encodeURL(feedUrl), rel: 'self', type }];
  if (hub) links.push({ href: encodeURL(hub), rel: 'hub' });
  return links;
}

function composeItemDescription(post, feedConfig, base, context) {
  const { content_limit, content_limit_delim } = feedConfig;

  if (post.description) {
    return post.description;
  } else if (post.intro) {
    return post.intro;
  } else if (post.excerpt) {
    return toAbsoluteUrls(post.excerpt, base, context);
  } else if (post.content) {
    // the content is cut first so that content_limit keeps counting characters
    // of the post as written; a url cut in half no longer matches the rewrite
    const short_content = post.content.substring(0, content_limit || 140);
    if (content_limit_delim) {
      const delim_pos = short_content.lastIndexOf(content_limit_delim);
      if (delim_pos > -1) {
        return toAbsoluteUrls(short_content.substring(0, delim_pos), base, context);
      }
    }
    return toAbsoluteUrls(short_content, base, context);
  }
  return '';
}

function composeItemContent(post, feedConfig, base, context) {
  const { content } = feedConfig;

  if (content && post.content) {
    // eslint-disable-next-line no-control-regex
    return toAbsoluteUrls(post.content.replace(/[\x00-\x1F\x7F]/g, ''), base, context);
  }
  return '';
}

function composeItemCategories(post) {
  const items = [
    ...post.categories ? post.categories.toArray() : [],
    ...post.tags ? post.tags.toArray() : []
  ];
  return items.map(item => ({ name: item.name, domain: item.permalink }));
}

function atomText(value, type) {
  if (!value) return;
  return type ? { value, type } : { value };
}

function composeItem(post, feedConfig, context) {
  const link = encodeURL(full_url_for.call(context, post.permalink));

  return {
    title: post.title,
    link,
    description: composeItemDescription(post, feedConfig, link, context),
    published: post.date.toDate(),
    updated: post.updated ? post.updated.toDate() : post.date.toDate(),
    content: composeItemContent(post, feedConfig, link, context),
    enclosures: post.image && [{ url: full_url_for.call(context, post.image) }],
    categories: composeItemCategories(post)
  };
}

function composeRssItem(feed, item) {
  return {
    title: item.title,
    link: item.link,
    guid: item.link,
    description: item.description,
    pubDate: item.published,
    authors: [feed.author],
    content: { encoded: item.content },
    enclosures: item.enclosures,
    categories: item.categories
  };
}

function composeAtomEntry(feed, item) {
  const entryLinks = [
    { href: item.link },
    ...(item.enclosures || []).map(enclosure => ({ href: enclosure.url, rel: 'enclosure' }))
  ];

  return {
    title: atomText(item.title),
    id: item.link,
    links: entryLinks,
    summary: atomText(item.description, 'html'),
    content: atomText(item.content, 'html'),
    published: item.published,
    updated: item.updated || item.published,
    authors: feed.author.name && [feed.author],
    categories: item.categories.map(cat => ({ term: cat.name, scheme: cat.domain }))
  };
}

function generateRss(feed, items) {
  const links = composeFeedLinks(feed.feedUrl, feed.hub, 'application/rss+xml');

  return generateRssFeed({
    title: feed.title,
    description: feed.description,
    link: encodeURL(feed.url),
    language: feed.language,
    copyright: feed.copyright,
    generator: 'Hexo',
    lastBuildDate: feed.updated,
    image: feed.icon && {
      url: feed.icon,
      title: feed.title,
      link: encodeURL(feed.url)
    },
    atom: { links },
    items: items.map(item => composeRssItem(feed, item))
  }, { lenient: true });
}

function generateAtom(feed, items) {
  const links = [
    { href: encodeURL(feed.url), rel: 'alternate' },
    ...composeFeedLinks(feed.feedUrl, feed.hub)
  ];

  return generateAtomFeed({
    title: atomText(feed.title),
    id: encodeURL(feed.url),
    subtitle: atomText(feed.description),
    updated: feed.updated,
    links,
    generator: { text: 'Hexo', uri: 'https://hexo.io/' },
    icon: feed.icon,
    rights: atomText(feed.copyright),
    authors: feed.author.name && [feed.author],
    entries: items.map(item => composeAtomEntry(feed, item)),
    language: feed.language
  }, { lenient: true });
}

module.exports = function(locals, type, path) {
  const { config } = this;
  const { feed: feedConfig } = config;

  const posts = composePosts(locals.posts, feedConfig);

  if (posts.length <= 0) {
    feedConfig.autodiscovery = false;
    return;
  }

  const feed = composeFeed(config, path, this, posts);
  const items = posts.toArray().map(post => composeItem(post, feedConfig, this));

  let data;
  switch (type) {
    case 'rss2':
      data = generateRss(feed, items);
      break;
    default:
      data = generateAtom(feed, items);
  }

  return {
    path,
    data
  };
};
