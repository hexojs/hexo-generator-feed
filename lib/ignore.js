'use strict';

/* Source: 
https://github.com/alexbruno/hexo-generator-json-content
https://github.com/alexbruno/hexo-generator-json-content/blob/90745de5330933f97f4124dcc90c027b061c5819/src/modules/ignore.js
*/

function ignoreSettings(cfg) {
    const ignore = cfg.ignore ? cfg.ignore : {};
  
    ignore.paths = ignore.paths
      ? ignore.paths.map((path) => path.toLowerCase())
      : [];
    
    ignore.tags = ignore.tags
      ? ignore.tags.map((tag) => tag.replace('#', '').toLowerCase())
      : [];
    
    return ignore;
}
  
function isIgnored(content, settings) {
    if (content.feed === false) {
        return true;
    }

    if (content.feed === true) {
        return false;
    }

    const pathIgnored = settings.paths.find((path) => content.path.includes(path));

    if (pathIgnored) {
        return true;
    }

    const tags = content.tags ? content.tags.map(mapTags) : [];
    const tagIgnored = tags.filter((tag) => settings.tags.includes(tag)).length;

    if (tagIgnored) {
        return true;
    }

    return false;
}

function mapTags(tag) {
    return typeof tag === 'object' ? tag.name.toLowerCase() : tag;
}

module.exports = {
    isIgnored: isIgnored,
    ignoreSettings: ignoreSettings
};
