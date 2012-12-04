# [Hexo] Plugins

Official plugins for [Hexo].

## List

[Plugin List](http://zespia.tw/hexo/plugins/)

## Development

[Plugin development](http://zespia.tw/hexo/docs/plugin-development.html)

## Usage

### Install

```
npm install <plugin-name> --save
```

### Enable

Add plugin name to `plugins` in `_config.yml`.

``` yaml
plugins:
- plugin-one
- plugin-name
```

### Disable

Remove plugin name from `plugins` in `_config.yml`.

``` yaml
plugins:
- plugin-one
```

### Update

Execute the following command.

```
npm update
```

### Uninstall

Execute the following command. Don't forget to disable the plugin before uninstalling.

```
npm uninstall <plugin-name>
```

[Hexo]: http://zespia.tw/hexo