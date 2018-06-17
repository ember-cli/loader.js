'use strict';
var shouldUseInstrumentedBuild = require('./utils').shouldUseInstrumentedBuild;

module.exports = {
  name: 'loader.js',

  init: function() {
    this._super.init && this._super.init.apply(this, arguments);

    this.treePaths['vendor'] = 'dist';
  },

  included: function(app, parentAddon) {
    var isProduction = process.env.EMBER_ENV === 'production';

    if (false /* hotfix */&& shouldUseInstrumentedBuild()) {
      app.import('vendor/loader/loader.instrument.js', {
        prepend: true
      });
    } else if (!isProduction) {
      app.import('vendor/loader/loader.debug.js', {
        prepend: true
      });
    } else {
      app.import('vendor/loader/loader.js', {
        prepend: true
      });
    }
  }
};
