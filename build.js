#!/usr/bin/env node

var babel = require('babel-core');
var transform = babel.transform;
var fs = require('fs');
var mkdirp = require('mkdirp').sync;

var baseTransformPlugins = [
  'transform-es2015-destructuring',
  ['babel-plugin-debug-macros', {
    envFlags: {
      source: 'env-flags',
      flags: { DEBUG: true }
    },
    debugTools: {
      source: 'debug-tools'
    }
  }]
];

mkdirp('./dist/loader');
var source = fs.readFileSync('./lib/loader/loader.js', 'utf8');

var instrumented = transform(source, {
  plugins: baseTransformPlugins
}).code;

var debug = transform(source, {
  plugins: baseTransformPlugins
}).code;

var stripped = transform(source, {
  // strip-heimdall *must* come before transpiling destructuring
  plugins: [
    'babel6-plugin-strip-heimdall'
  ].concat(baseTransformPlugins)
}).code;

fs.writeFileSync('./dist/loader/loader.instrument.js', instrumented);
fs.writeFileSync('./dist/loader/loader.debug.js', debug);
fs.writeFileSync('./dist/loader/loader.js', stripped);
