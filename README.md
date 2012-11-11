# [Hexo] Plugins

Official plugins for [Hexo].

## Contents

- [Usage](#usage)
- [Generator](#generator)
- [Renderer](#renderer)
- [Helper](#helper)
- [Deployer](#deployer)
- [Processor](#processor)
- [Tag](#tag)
- [Console](#console)
- [Development](#development)

## Usage

### Install

Execute the following command.

``` bash
npm install <plugin-name>
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

``` bash
npm update
```

### Uninstall

Execute the following command. Don't forget to disable the plugin before uninstalling.

``` bash
npm uninstall <plugin-name>
```

## Generator

Generator is used to generate static files.

- [hexo-generator-feed] - RSS Feed
- [hexo-generator-sitemap] - Sitemap

<a id="renderer"></a>
## Renderer

Renderer is used to process specific files.

- [hexo-renderer-coffeescript] - CoffeeScript
- [hexo-renderer-haml] - Haml
- [hexo-renderer-jade] - Jade
- [hexo-renderer-less] - Less

## Helper

Helper is the function used in articles.

## Deployer

Deployer is used to deploy.

## Processor

Processor is used to process source files.

## Tag

Tag is the function used in articles.

## Console

Console allows you to execute commands in command-line interface (CLI).

## Development

Reference [plugin development](../docs/plugin-development.html) for more info.

[Hexo]: http://zespia.tw/hexo
[hexo-generator-feed]: https://github.com/tommy351/hexo-plugins/tree/master/generator/feed
[hexo-generator-sitemap]: https://github.com/tommy351/hexo-plugins/tree/master/generator/sitemap
[hexo-renderer-coffeescript]: https://github.com/tommy351/hexo-plugins/tree/master/renderer/coffeescript
[hexo-renderer-haml]: https://github.com/tommy351/hexo-plugins/tree/master/renderer/haml
[hexo-renderer-jade]: https://github.com/tommy351/hexo-plugins/tree/master/renderer/jade
[hexo-renderer-less]: https://github.com/tommy351/hexo-plugins/tree/master/renderer/less
[wiki]: https://github.com/tommy351/hexo/wiki/Plugins