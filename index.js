'use strict';

module.exports = {
  name: 'loader.js',

  init: function() {
    this.treePaths['vendor'] = 'lib';
  },

  included: function() {
    this.app.import('vendor/loader.js', {
      prepend: true
    });
  }
};
