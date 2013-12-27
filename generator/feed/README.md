# Feed generator for [Hexo]

This plugin can generate Atom 1.0 and RSS 2.0 feed.

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
- **limit** - Maximum number of posts in the feed

[Hexo]: http://zespia.tw/hexo