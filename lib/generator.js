'use strict';

const { Feed } = require('feed');
const { gravatar, full_url_for, encodeURL } = require('hexo-util');

module.exports = function(locals, type, path) {
  const { config } = this;
  const { email, feed: feedConfig, url: urlCfg } = config;
  const { icon: iconCfg, limit, order_by, content, content_limit, content_limit_delim } = feedConfig;

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

  // Create Feed instance with simpler configuration
  const feed = new Feed({
    title: config.title,
    description: config.subtitle || config.description || '',
    id: encodeURL(url),
    link: encodeURL(url),
    language: config.language || 'en',
    image: icon || undefined, // Ensure icon is passed
    copyright: config.author ? `All rights reserved ${new Date().getFullYear()}, ${config.author}` : '',
    generator: 'Hexo',
    feedLinks: {
      atom: type === 'atom' ? encodeURL(feed_url) : undefined,
      rss: type === 'rss2' ? encodeURL(feed_url) : undefined
    },
    author: config.author ? {
      name: config.author,
      email: email,
      link: url
    } : undefined
  });

  // Add articles
  posts.toArray().forEach(post => {
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

    const item = {
      title: post.title || '',
      id: encodeURL(full_url_for.call(this, post.permalink)),
      link: encodeURL(full_url_for.call(this, post.permalink)),
      description: description,
      content: postContent,
      author: config.author ? [{
        name: config.author,
        email: email,
        link: url
      }] : [],
      date: post.updated ? post.updated.toDate() : post.date.toDate(),
      published: post.date.toDate()
    };

    // Handle images as enclosure
    if (post.image) {
      item.image = full_url_for.call(this, post.image);
    }

    // Add categories and tags
    if (post.categories && post.categories.length > 0) {
      item.category = post.categories.toArray().map(cat => ({
        term: cat.name,
        scheme: cat.permalink
      }));
    }

    if (post.tags && post.tags.length > 0) {
      const tags = post.tags.toArray().map(tag => ({
        term: tag.name,
        scheme: tag.permalink
      }));
      if (item.category) {
        item.category = item.category.concat(tags);
      } else {
        item.category = tags;
      }
    }

    feed.addItem(item);
  });

  // Generate corresponding format based on type
  let data;
  switch (type) {
    case 'rss2':
      data = feed.rss2();
      break;
    case 'atom':
      data = feed.atom1();
      break;
    default:
      data = feed.atom1();
  }

  return {
    path,
    data
  };
};
