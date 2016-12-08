#!/usr/bin/env node

var babel = require('babel-core');
var transform = babel.transform;
var fs = require('fs');
var stripHeimdall = require('babel5-plugin-strip-heimdall');
var mkdirp = require('mkdirp').sync;

mkdirp('./dist/loader');
var source = fs.readFileSync('./lib/loader/loader.js', 'utf8');
var instrumented = transform(source, {
  whitelist: ['es6.destructuring']
}).code;

var stripped = transform(source, {
  plugins: [stripHeimdall],
  whitelist: ['es6.destructuring']
}).code;

fs.writeFileSync('./dist/loader/loader.instrument.js', instrumented);
fs.writeFileSync('./dist/loader/loader.js', stripped);

