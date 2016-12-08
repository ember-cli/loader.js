var shouldInstrument = require('../../utils').shouldUseInstrumentedBuild;
var loader;
if (shouldInstrument()) {
  loader = require('../dist/loader/loader.instrument.js');
} else {
  loader = require('../dist/loader/loader.js');
}

module.exports = loader;
