# hexo-generator-feed

[![Build Status](https://travis-ci.org/hexojs/hexo-generator-feed.svg?branch=master)](https://travis-ci.org/hexojs/hexo-generator-feed)  [![NPM version](https://badge.fury.io/js/hexo-generator-feed.svg)](http://badge.fury.io/js/hexo-generator-feed) [![Coverage Status](https://img.shields.io/coveralls/hexojs/hexo-generator-feed.svg)](https://coveralls.io/r/hexojs/hexo-generator-feed?branch=master)

Generate Atom 1.0 or RSS 2.0 feed.

## Install

``` bash
$ npm install hexo-generator-feed --save
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
  content_limit: 140
  content_limit_delim: ' '
```

- **type** - Feed type. (atom/rss2)
- **path** - Feed path. (Default: atom.xml/rss2.xml)
- **limit** - Maximum number of posts in the feed (Use `0` or `false` to show all posts)
- **hub** - URL of the PubSubHubbub hubs (Leave it empty if you don't use it)
- **content** - (optional) set to 'true' to include the contents of the entire post in the feed.
- **content_limit** - (optional) Default length of post content used in summary. Only used, if **content** setting is false and no custom post description present.
- **content_limit_delim** - (optional) If **content_limit** is used to shorten post contents, only cut at the last occurrence of this delimiter before reaching the character limit. Not used by default.
