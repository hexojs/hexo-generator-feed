#!/usr/bin/env node
var migrate = require('./migrate');


main();

function main() {
  migrate({
    write: function(target, content, next) {
      console.log('###');
      console.log('target', target);
      console.log(content);

      next();
    },
  }, 'data.json', 'out/');
}

