# Discount renderer plugin for [Hexo]

This plugins uses [Discount] to parse markdown, which is more powerful than built-in [marked] markdown parser.

## Usage

### Install

```
npm install hexo-renderer-discount --save
```

### Enable

Add `hexo-renderer-discount` to `plugins` in `_config.yml`.

``` yaml
plugins:
- hexo-renderer-discount
```

### Disable

Remove `hexo-renderer-discount` from `plugins` in `_config.yml`.

``` yaml
plugins:
- hexo-renderer-discount
```

### Update

Execute the following command.

```
npm update
```

### Uninstall

Execute the following command. Don't forget to disable the plugin before uninstalling.

```
npm uninstall hexo-renderer-discount
```

## Features

- Tables
- Footnotes
- Definition Lists
- Abbreviations
- [More…](http://www.pell.portland.or.us/~orc/Code/discount)

## Known Issues

- Indent of Backtick code block

[Hexo]: http://zespia.tw/hexo
[Discount]: http://www.pell.portland.or.us/~orc/Code/discount/
[marked]: https://github.com/chjj/marked