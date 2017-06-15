this.heimdall = global.heimdall = require('heimdalljs');
var loader = require('../loader');
var measure = require('../handler').measure;

module.exports = function() {
  return measure(function() {
    loader.define('foo' + -1, function() {});
    for (var i = 0; i < 1000; i++) {
      loader.define.exports('foo' + i, {hbs: true, "id": "VVZNWoRm", "block": "{\"statements\":[[1,[26,[\"welcome-page\"]],false],[0,\"\\n\"],[0,\"\\n\"],[1,[26,[\"outlet\"]],false]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "my-foo-app/templates/application.hbs" }});
    }

    for (var i = 0; i < 1000; i++) {
      loader.require('foo' + i);
    }
  });
};
