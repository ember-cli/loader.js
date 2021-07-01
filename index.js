'use strict';

var shouldUseInstrumentedBuild = require('./utils').shouldUseInstrumentedBuild;

module.exports = {
  name: 'loader.js',

  init: function() {
    this._super.init && this._super.init.apply(this, arguments);
    this.treePaths['vendor'] = 'dist';
  },

  included: function() {
    if (false /* hotfix */&& shouldUseInstrumentedBuild()) {
      this._importLoaderJs('vendor/loader/loader.instrument.js', {
        prepend: true
      })
    } else {
      this._importLoaderJs('vendor/loader/loader.js', {
        prepend: true
      });
    }
  },

  _importLoaderJs() {
    if (typeof this.import === 'function') {
      return this.import(...arguments);
    }

    return this.app.import(...arguments);
  }
};
