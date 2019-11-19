# hexo-generator-feed

[![Build Status](https://travis-ci.org/hexojs/hexo-generator-feed.svg?branch=master)](https://travis-ci.org/hexojs/hexo-generator-feed)
[![NPM version](https://badge.fury.io/js/hexo-generator-feed.svg)](https://www.npmjs.com/package/hexo-generator-feed)
[![Coverage Status](https://img.shields.io/coveralls/hexojs/hexo-generator-feed.svg)](https://coveralls.io/r/hexojs/hexo-generator-feed?branch=master)

Generate Atom 1.0 or RSS 2.0 feed.

## Install

``` bash
$ npm install hexo-generator-feed --save
```

- Hexo 4: 2.x
- Hexo 3: 1.x
- Hexo 2: 0.x

## Use

In the [front-matter](https://hexo.io/docs/front-matter.html) of your post, you can optionally add a `description`, `intro` or `excerpt` setting to write a summary for the post. Otherwise the summary will default to the excerpt or the first 140 characters of the post.

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
  order_by: -date
  icon: icon.png
  autodiscovery: true
  template:
```

- **type** - Feed type. `atom` or `rss2`. Specify `['atom', 'rss2']` to output both types. (Default: `atom`)
  * Example:
  ``` yaml
  feed:
    # Generate atom feed
    type: atom

    # Generate both atom and rss2 feeds
    type:
      - atom
      - rss2
    path:
      - atom.xml
      - rss2.xml
  ```
- **path** - Feed path. When both types are specified, path must follow the order of type value. (Default: atom.xml/rss2.xml)
- **limit** - Maximum number of posts in the feed (Use `0` or `false` to show all posts)
- **hub** - URL of the PubSubHubbub hubs (Leave it empty if you don't use it)
- **content** - (optional) set to 'true' to include the contents of the entire post in the feed.
- **content_limit** - (optional) Default length of post content used in summary. Only used, if **content** setting is false and no custom post description present.
- **content_limit_delim** - (optional) If **content_limit** is used to shorten post contents, only cut at the last occurrence of this delimiter before reaching the character limit. Not used by default.
- **order_by** - Feed order-by. (Default: -date)
- **icon** - (optional) Custom feed icon. Defaults to a gravatar of email specified in the main config.
- **autodiscovery** - Add feed [autodiscovery](http://www.rssboard.org/rss-autodiscovery). (Default: `true`)
  * Many themes already offer this feature, so you may also need to adjust the theme's config if you wish to disable it.
- **template** - Custom template path(s). This file will be used to generate feed xml file, see the default templates: [atom.xml](atom.xml) and [rss2.xml](rss2.xml).
  * It is possible to specify just one custom template, even when this plugin is configured to output both feed types,
  ``` yaml
  # (Optional) Exclude custom template from being copied into public/ folder
  # Alternatively, you could also prepend an underscore to its filename, e.g. _custom.xml
  # https://hexo.io/docs/configuration#Include-Exclude-Files-or-Folders
  exclude:
    - 'custom.xml'
  feed:
    type:
      - atom
      - rss2
    template:
      - ./source/custom.xml
    # atom will be generated using custom.xml
    # rss2 will be generated using the default template instead
  ```
