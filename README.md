# Feed generator

Generate Atom 1.0 or RSS 2.0 feed.

## Install

``` bash
$ npm install hexo-generator-feed --save
```

## Options

You can configure this plugin in `_config.yml`.

``` yaml
feed:
    type: atom
    path: atom.xml
    limit: 20
```

- **type** - Feed type. (atom/rss2)
- **path** - Feed path. (Default: atom.xml/rss2.xml)
- **limit** - Maximum number of posts in the feed (Use `0` or `false` to show all posts)