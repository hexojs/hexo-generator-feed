# hexo-generator-feed-westerndevs

[![Build Status](https://travis-ci.org/westerndevs/hexo-generator-feed.svg?branch=master)](https://travis-ci.org/westerndevs/hexo-generator-feed)  [![NPM version](https://badge.fury.io/js/hexo-generator-feed-westerndevs.svg)](https://badge.fury.io/js/hexo-generator-feed-westerndevs.svg)

Generate Atom 1.0 or RSS 2.0 feed.

## Install

``` bash
$ npm install hexo-generator-feed-westerndevs --save
```

- Hexo 3: 1.x
- Hexo 2: 0.x

## Use

In the [front-matter](https://hexo.io/docs/front-matter.html) of your post, you can optionally add a `description` setting to write a summary for the post. Otherwise the summary will default to the excerpt or the first 140 characters of the post.

## Options

You can configure this plugin in `_config.yml`.

``` yaml
feed:
  type: atom
  path: atom.xml
  limit: 20
  hub:
  content:
```

- **type** - Feed type. (atom/rss2)
- **path** - Feed path. (Default: atom.xml/rss2.xml)
- **limit** - Maximum number of posts in the feed (Use `0` or `false` to show all posts)
- **hub** - URL of the PubSubHubbub hubs (Leave it empty if you don't use it)
- **content** - (optional) set to 'true' to include the contents of the entire post in the feed.
