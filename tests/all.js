/*globals newDefine:false, newLoader:false, newRequire:false*/
/*globals define:true, loader:true, require:true, requirejs:true, heimdall:true, Heimdall:true */
/* jshint -W097 */

'use strict';
var tree;

/**
 * Simple helper to get the current state of a given module.
 */
function getModuleState(id) {
  return requirejs.entries[id].state;
}

function statsForMonitor(monitor, tree) {
  var stats = {};

  tree.construct();
  tree.visitPreOrder(function(node) {
    var mStats = node.stats[monitor];
    if (mStats) {
      var statKeys = Object.keys(mStats);
      statKeys.forEach(function(key) {
        if (stats[key] === undefined) {
          stats[key] = mStats[key];
        } else {
          stats[key] += mStats[key];
        }
      });
    }
  });

  return stats;
}

module('loader.js api', {
  setup: function() {
    this._define = define;
    this._loader = loader;
    this._require = require;
    heimdall._session.reset();
    tree = new Heimdall.Tree(heimdall);
  },

  teardown: function() {
    define = this._define;
    loader = this._loader;
    require = this._require;

    requirejs.clear();
  }
});

test('has api', function() {
  equal(typeof loader, 'object');
  equal(typeof loader.noConflict, 'function');
  equal(typeof loader.makeDefaultExport, 'boolean');
  equal(typeof require, 'function');
  equal(typeof define, 'function');
  strictEqual(define.amd, undefined);
  equal(typeof requirejs, 'function');
  equal(typeof requireModule, 'function');
});

test('no conflict mode', function() {
  loader.noConflict({
    define: 'newDefine',
    loader: 'newLoader',
    require: 'newRequire'
  });

  equal(define, 'LOL');
  strictEqual(loader, undefined);
  equal(require, 'ZOMG');

  equal(newDefine, this._define);
  equal(newLoader, this._loader);
  equal(newRequire, this._require);
});

test('simple define/require', function() {
  var fooCalled = 0;

  define('foo', [], function() {
    fooCalled++;
  });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    define: 1,
    exports: 0,
    findDeps: 0,
    findModule: 0,
    modules: 1,
    pendingQueueLength: 0,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0
  });

  var foo = require('foo');
  equal(foo, undefined);
  equal(fooCalled, 1);
  deepEqual(Object.keys(requirejs.entries), ['foo']);

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  var fooAgain = require('foo');
  equal(fooAgain, undefined);
  equal(fooCalled, 1);

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  deepEqual(Object.keys(requirejs.entries), ['foo']);
});

test('define without deps', function() {
  var fooCalled = 0;

  define('foo', function() {
    fooCalled++;
  });

  var foo = require('foo');
  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  equal(foo, undefined);
  equal(fooCalled, 1);
  deepEqual(Object.keys(requirejs.entries), ['foo']);
});

test('multiple define/require', function() {
  define('foo', [], function() {

  });

  deepEqual(Object.keys(requirejs.entries), ['foo']);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 1,
    exports: 0,
    findModule: 0,
    modules: 1,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  define('bar', [], function() {

  });

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 2,
    exports: 0,
    findModule: 0,
    modules: 2,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  deepEqual(Object.keys(requirejs.entries), ['foo', 'bar']);
});


test('simple import/export', function() {
  expect(4);

  define('foo', ['bar'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('bar', [], function() {
    return {
      baz: 'baz'
    };
  });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 2,
    exports: 0,
    findModule: 0,
    modules: 2,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  equal(require('foo'), 'baz');

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('simple import/export with `exports`', function() {
  expect(4);

  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    equal(bar.baz, 'baz');

    __exports__.baz = bar.baz;
  });

  define('bar', ['exports'], function(__exports__) {
    __exports__.baz = 'baz';
  });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 2,
    exports: 0,
    findModule: 0,
    modules: 2,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  equal(require('foo').baz, 'baz');

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('relative import/export', function() {
  expect(4);
  define('foo/a', ['./b'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('foo/b', [], function() {
    return {
      baz: 'baz'
    };
  });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 2,
    exports: 0,
    findModule: 0,
    modules: 2,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  equal(require('foo/a'), 'baz');

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });
});

test('deep nested relative import/export', function() {
  expect(4);

  define('foo/a/b/c', ['../../b/b/c'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('foo/b/b/c', [], function() {
    return {
      baz: 'baz'
    };
  });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 0,
    define: 2,
    exports: 0,
    findModule: 0,
    modules: 2,
    reify: 0,
    require: 0,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 0
  });

  equal(require('foo/a/b/c'), 'baz');

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });
});

test('assigns default when makeDefaultExport option enabled', function() {
  equal(loader.makeDefaultExport, true);

  var theObject = {};
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });
  ok(('default' in require('foo')));
  equal(require('foo'), theObject);
  equal(theObject.default, theObject);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('doesn\'t assign default when makeDefaultExport option is disabled', function() {
  var _loaderMakeDefaultExport = loader.makeDefaultExport;
  loader.makeDefaultExport = false;
  var theObject = {};
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });
  ok(!('default' in require('foo')));
  deepEqual(require('foo'), {});

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  // clean up
  loader.makeDefaultExport = _loaderMakeDefaultExport;
});

test('doesn\'t assign default when makeDefaultExport option is enabled and default is already defined', function() {
  equal(loader.makeDefaultExport, true);

  var theObject = { default: 'bar' };
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });
  ok(('default' in require('foo')));
  equal(require('foo').default, 'bar');
  deepEqual(require('foo'), { default: 'bar' });

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 3,
    modules: 1,
    reify: 1,
    require: 3,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('incorrect lookup paths should fail', function() {

  define('foo/isolated-container', [], function() {
    return 'container';
  });


  define('foo', ['./isolated-container'], function(container) {
    return {
      container: container
    };
  });

  throws(function() {
    return require('foo');
  }, 'Could not find module isolated-container');

});

test('top-level relative import/export', function() {
  expect(3);

  define('foo', ['./bar'], function(bar) {
    equal(bar.baz, 'baz');

    return bar.baz;
  });

  define('bar', [], function() {
    return {
      baz: 'baz'
    };
  });

  equal(require('foo'), 'baz');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });
});

test('runtime cycles', function() {
  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    __exports__.quz = function() {
      return bar.baz;
    };
  });

  define('bar', ['foo', 'exports'], function(foo, __exports__) {
    __exports__.baz = function() {
      return foo.quz;
    };
  });

  var foo = require('foo');
  var bar = require('bar');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 4,
    modules: 2,
    reify: 2,
    require: 2,
    resolve: 2,
    resolveRelative: 0,
    pendingQueueLength: 2
  });

  ok(foo.quz());
  ok(bar.baz());

  equal(foo.quz(), bar.baz, 'cycle foo depends on bar');
  equal(bar.baz(), foo.quz, 'cycle bar depends on foo');
});

test('already evaluated modules are not pushed into the queue', function() {
  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    __exports__.quz = function() {
      return bar.baz;
    };
  });

  define('bar', ['foo', 'exports'], function(foo, __exports__) {
    __exports__.baz = function() {
      return foo.quz;
    };
  });

  require('bar');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 3,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 2,
    resolveRelative: 0,
    pendingQueueLength: 2
  });

  require('foo');

  stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 4,
    modules: 2,
    reify: 2,
    require: 2,
    resolve: 2,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('same pending modules should not be pushed to the queue more than once', function() {
  define('foo', ['bar', 'exports'], function(bar, __exports__) {
    __exports__.quz = function() {
      return bar.baz;
    };
  });

  define('bar', ['foo', 'exports'], function(foo, __exports__) {
    __exports__.baz = function() {
      return foo.quz;
    };
  });

  require('bar');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 3,
    modules: 2,
    reify: 2,
    require: 1,
    resolve: 2,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('basic CJS mode', function() {
  define('a/foo', ['require', 'exports', 'module'], function(require, exports, module) {
    module.exports = {
      bar: require('./bar').name
    };
  });

  define('a/bar', ['require', 'exports', 'module'], function(require, exports) {
    exports.name = 'bar';
  });

  var foo = require('a/foo');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 2,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });

  equal(foo.bar, 'bar');
});

test('pass default deps if arguments are expected and deps not passed', function() {
  // this is intentionally testing the array-less form
  define('foo', function(require, exports, module) { // jshint ignore:line
    equal(arguments.length, 3);
  });

  require('foo');
});

test('if factory returns a value it is used as export', function() {
  define('foo', ['require', 'exports', 'module'], function() {
    return {
      bar: 'bar'
    };
  });

  var foo = require('foo');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  equal(foo.bar, 'bar');
});

test('if a module has no default property assume the return is the default', function() {
  define('foo', [], function() {
    return {
      bar: 'bar'
    };
  });

  var foo = require('foo')['default'];

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  equal(foo.bar, 'bar');
});


test('if a CJS style module has no default export assume module.exports is the default', function() {
  define('Foo', ['require', 'exports', 'module'], function(require, exports, module) {
    module.exports = function Foo() {
      this.bar = 'bar';
    };
  });

  var Foo = require('Foo')['default'];
  var foo = new Foo();

  equal(foo.bar, 'bar');
  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});


test('if a module has no default property assume its export is default (function)', function() {
  var theFunction = function theFunction() {};
  define('foo', ['require', 'exports', 'module'], function() {
    return theFunction;
  });

  equal(require('foo')['default'], theFunction);
  equal(require('foo'), theFunction);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('if a module has no default property assume its export is default (object)', function() {
  var theObject = {};
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });

  equal(require('foo')['default'], theObject);
  equal(require('foo'), theObject);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('does not add default if export is frozen', function() {
  var theObject = Object.freeze({});
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });

  ok(!('default' in require('foo')));
  equal(require('foo'), theObject);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('does not add default if export is sealed', function() {
  var theObject = Object.seal({ derp: {} });
  define('foo', ['require', 'exports', 'module'], function() {
    return theObject;
  });

  ok(!('default' in require('foo')));
  equal(require('foo'), theObject);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 2,
    modules: 1,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('has good error message for missing module', function() {
  var theFunction = function theFunction() {};
  define('foo', ['apple'], function() {
    return theFunction;
  });

  throws(function() {
    require('foo');
  }, /Could not find module `apple` imported from `foo`/);
});

test('provides good error message when an un-named AMD module is provided', function() {
  throws(function() {
    define(function() {

    });
  }, new Error('an unsupported module was defined, expected `define(id, deps, module)` instead got: `1` arguments to define`'));
});


test('throws when accessing parent module of root', function() {
  expect(2);

  define('foo', ['../a'], function() {});

  throws(function() {
    require('foo');
  }, /Cannot access parent module of root/);

  define('bar/baz', ['../../a'], function() {});

  throws(function() {
    require('bar/baz');
  }, /Cannot access parent module of root/);
});

test('relative CJS esq require', function() {
  define('foo/a', ['require'], function(require) {
    return require('./b');
  });


  define('foo/b', ['require'], function(require) {
    return require('./c');
  });

  define('foo/c', ['require'], function() {
    return 'c-content';
  });

  equal(require('foo/a'), 'c-content');
});


test('relative CJS esq require (with exports and module);', function() {
  define('foo/a', ['module', 'exports', 'require'], function(module, exports, require) {
    module.exports = require('./b');
  });

  define('foo/b', ['module', 'exports', 'require'], function(module, exports, require) {
    module.exports = require('./c');
  });

  define('foo/c', ['module', 'exports', 'require'], function(module) {
    module.exports = 'c-content';
  });

  equal(require('foo/a'), 'c-content');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 3,
    define: 3,
    exports: 3,
    findModule: 3,
    modules: 3,
    reify: 3,
    require: 3,
    resolve: 2,
    resolveRelative: 2,
    pendingQueueLength: 3
  });
});

test('foo foo/index are the same thing', function() {
  define('foo/index', [] , function() {
    return { 'default': 'hi' };
  });

  define('foo', [ ], define.alias('foo/index'));

  define('bar', ['foo', 'foo/index'] , function(foo, fooIndex) {
    deepEqual(foo, fooIndex);
  });

  deepEqual(require('foo'), require('foo/index'));

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 3,
    exports: 1,
    findModule: 2,
    modules: 3,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('foo automatically falls back to foo/index', function() {
  define('foo/index', [] , function() {
    return { 'default': 'hi' };
  });

  define('bar', ['foo', 'foo/index'] , function(foo, fooIndex) {
    deepEqual(foo, fooIndex);
  });

  deepEqual(require('foo'), require('foo/index'));

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 2,
    exports: 1,
    findModule: 2,
    modules: 2,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('automatic /index fallback no ambiguity', function() {
  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 4,
    modules: 2,
    reify: 2,
    require: 3,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('automatic /index fallback is not used if module is defined', function() {
  define('foo', [], function() {
    return 'I AM foo';
  });

  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo');
  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 3,
    define: 3,
    exports: 3,
    findModule: 4,
    modules: 3,
    reify: 3,
    require: 3,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 3
  });
});

test('unsee', function() {
  var counter = 0;
  define('foo', [] , function() {
    counter++;
    return { 'default': 'hi' };
  });

  equal(counter, 0);
  require('foo');
  equal(counter, 1);
  require('foo');
  equal(counter, 1);
  require.unsee('foo');
  equal(counter, 1);
  require('foo');
  equal(counter, 2);
  require('foo');
  equal(counter, 2);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 1,
    exports: 2,
    findModule: 5,
    modules: 1,
    reify: 2,
    require: 4,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('manual /index fallback no ambiguity', function() {
  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('foo', define.alias('foo/index'));

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 3,
    exports: 2,
    findModule: 4,
    modules: 3,
    reify: 2,
    require: 3,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('manual /index fallback with ambiguity (alias after)', function() {
  var counts = {
    foo: 0,
    'foo/index': 0
  };

  define('foo', [], function() {
    counts.foo++;
    return 'I AM foo';
  });

  define('foo/index', [], function() {
    counts['foo/index']++;
    return 'I AM foo/index';
  });

  define('foo', define.alias('foo/index'));

  define('bar', ['foo', 'foo/index'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(counts, {
    foo: 0,
    'foo/index': 1
  });

  deepEqual(stats, {
    define: 4,
    exports: 2,
    findDeps: 2,
    findModule: 5,
    modules: 4,
    pendingQueueLength: 2,
    reify: 2,
    require: 3,
    resolve: 2,
    resolveRelative: 0
  });
});

test('manual /index fallback with ambiguity (alias after all defines but before require)', function() {
  define('foo', [], function() {
    return 'I AM foo';
  });

  define('foo/index', [], function() {
    return 'I AM foo/index';
  });

  define('bar', ['foo'], function(foo) {
    return 'I AM bar with: ' + foo;
  });

  define('foo', define.alias('foo/index'));

  equal(require('foo'), 'I AM foo/index');
  equal(require('foo/index'), 'I AM foo/index');
  equal(require('bar'), 'I AM bar with: I AM foo/index');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 4,
    exports: 2,
    findModule: 4,
    modules: 4,
    reify: 2,
    require: 3,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('alias entries share same module instance', function() {
  var count = 0;
  define('foo', define.alias('foo/index'));

  define('foo/index', [], function() {
    count++;
  });

  equal(count, 0);
  require('foo');
  equal(count, 1);

  require('foo/index');
  equal(count, 1, 'second require should use existing instance');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 2,
    exports: 1,
    findModule: 2,
    modules: 2,
    reify: 1,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('alias with 2 arguments entries share same module instance', function() {
  var count = 0;
  define.alias('foo/index', 'bar');

  define('foo/index', [], function() {
    count++;
    return {};
  });

  equal(count, 0);
  var bar = require('bar');
  equal(count, 1);

  var fooIndex = require('foo/index');
  equal(count, 1, 'second require should use existing instance');

  strictEqual(bar, fooIndex);
});

test('/index fallback + unsee', function() {
  var count = 0;
  define('foo/index', [], function() {
    count++;
  });

  define('foo', define.alias('foo/index'));

  require('foo/index');
  equal(count, 1);

  require('foo/index');
  equal(count, 1);

  require.unsee('foo/index');
  require('foo/index');

  equal(count, 2);

  require.unsee('foo');
  require('foo');

  equal(count, 3);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 3,
    define: 2,
    exports: 3,
    findModule: 6,
    modules: 2,
    reify: 3,
    require: 4,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 3
  });
});

test('alias with target \w deps', function() {
  define('foo', ['bar'], function(bar) {
    return bar;
  });

  define('bar', [], function() {
    return 'I AM BAR';
  });

  define('quz', define.alias('foo'));

  equal(require('quz'), 'I AM BAR');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 3,
    exports: 2,
    findModule: 2,
    modules: 3,
    reify: 2,
    require: 1,
    resolve: 1,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('alias chain (simple)', function() {
  define('bar', [], function() {
    return 'I AM BAR';
  });

  define('quz', define.alias('foo'));
  define('foo', define.alias('bar'));

  equal(require('quz'), 'I AM BAR');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 3,
    exports: 1,
    findModule: 1,
    modules: 3,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('alias chain (simple) with implicit /index', function() {
  define('bar/index', [], function() {
    return 'I AM BAR';
  });

  define('quz', define.alias('foo'));
  define('foo', define.alias('bar'));

  equal(require('quz'), 'I AM BAR');
  throws(function() {
    require('quz/index');
  }, 'Could not find module `quz/index` imported from `(require)`');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 3,
    exports: 1,
    findModule: 1,
    modules: 3,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('alias chain (long)', function() {
  define('bar', [], function() {
    return 'I AM BAR';
  });

  define('quz', define.alias('foo'));
  define('foo', define.alias('bar'));
  define('baz', define.alias('quz'));
  define('bozo', define.alias('baz'));

  equal(require('bozo'), 'I AM BAR');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 5,
    exports: 1,
    findModule: 1,
    modules: 5,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });
});

test('alias chains are lazy', function() {
  define('bar', [], function() {
    return 'I AM BAR';
  });

  define('bar2', [], function() {
    return 'I AM BAR2';
  });

  define('quz', define.alias('foo'));
  define('foo', define.alias('bar'));
  define('baz', define.alias('quz'));

  define('bozo', define.alias('baz'));
  define('bozo2', define.alias('baz'));

  equal(require('bozo'), 'I AM BAR');

  define('foo', define.alias('bar2'));

  equal(require('bozo'), 'I AM BAR2');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 8,
    exports: 2,
    findModule: 2,
    modules: 8,
    reify: 2,
    require: 2,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('alias chains propogate unsee', function() {
  var counter = 0;

  define('bar', [], function() {
    counter++;
    return 'I AM BAR';
  });

  define('a', define.alias('bar'));
  define('b', define.alias('a'));

  equal(counter, 0);
  equal(require('b'), 'I AM BAR');
  equal(counter, 1);
  equal(require('b'), 'I AM BAR');
  equal(counter, 1);
  require.unsee('b');
  equal(counter, 1);
  equal(require('b'), 'I AM BAR');
  equal(counter, 2);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 3,
    exports: 2,
    findModule: 4,
    modules: 3,
    reify: 2,
    require: 3,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('alias chains propogate unsee with implicit /index', function() {
  var counter = 0;

  define('bar/index', [], function() {
    counter++;
    return 'I AM BAR';
  });

  define('a', define.alias('bar'));
  define('b', define.alias('a'));

  equal(counter, 0);
  equal(require('b'), 'I AM BAR');
  equal(counter, 1);
  equal(require('b'), 'I AM BAR');
  equal(counter, 1);
  require.unsee('b');
  equal(counter, 1);
  equal(require('b'), 'I AM BAR');
  equal(counter, 2);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 3,
    exports: 2,
    findModule: 4,
    modules: 3,
    reify: 2,
    require: 3,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 2
  });
});

test('alias chaining with relative deps works', function() {
  define('foo/baz', [], function() {
    return 'I AM baz';
  });

  define('foo/index', ['./baz'], function(baz) {
    return 'I AM foo/index: ' + baz;
  });

  define('foo', define.alias('foo/index'));
  define('bar', define.alias('foo'));

  equal(require('foo'), 'I AM foo/index: I AM baz');
  equal(require('foo/index'), 'I AM foo/index: I AM baz');
  equal(require('bar'), 'I AM foo/index: I AM baz');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 4,
    exports: 2,
    findModule: 4,
    modules: 4,
    reify: 2,
    require: 3,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });
});

test('wrapModules is called when present', function() {
  var fooCalled = 0;
  var annotatorCalled = 0;
  var _loaderWrapModules = loader.wrapModules;
  loader.wrapModules = function(id, callback) {
    annotatorCalled++;
    return callback;
  };
  define('foo', [], function() {
    fooCalled++;
  });

  equal(annotatorCalled, 0);
  require('foo');
  equal(annotatorCalled, 1);

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 1,
    define: 1,
    exports: 1,
    findModule: 1,
    modules: 1,
    reify: 1,
    require: 1,
    resolve: 0,
    resolveRelative: 0,
    pendingQueueLength: 1
  });

  // clean up
  loader.wrapModules = _loaderWrapModules;
});

test('import require from "require" works', function () {
  define('foo/baz', function () {
    return 'I AM baz';
  });

  define('foo/index', ['require'], function (require) {
    return require.default('./baz');
  });

  equal(require('foo'), 'I AM baz');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 2,
    resolve: 1,
    resolveRelative: 1,
    pendingQueueLength: 2
  });
});

test('require has a has method', function () {
  define('foo/baz/index', function () {
    return 'I AM baz';
  });

  define('foo/index', ['require'], function (require) {
    if (require.has('./baz')) {
      return require.default('./baz');
    }
  });

  equal(require('foo'), 'I AM baz');

  var stats = statsForMonitor('loaderjs', tree);

  deepEqual(stats, {
    findDeps: 2,
    define: 2,
    exports: 2,
    findModule: 2,
    modules: 2,
    reify: 2,
    require: 2,
    resolve: 2,
    resolveRelative: 2,
    pendingQueueLength: 2
  });
});

test('broken modules are never returned', function() {
  define('foo', function() {
    throw new Error('I am a broken module');
  });

  throws(function() {
    require('foo');
  }, /I am a broken module/, 'The first time');

  throws(function() {
    require('foo');
  }, /I am a broken module/, 'The second time');
});

test('modules with broken dependencies are never returned', function() {
  define('foo', ['other'], function() {
    throw new Error('I am a broken module');
  });

  define('valid-dep-before', function() {
  });

  define('valid-dep-after', function() {
  });
  define('other', function() {
  });


  define('bar', ['valid-dep-before', 'foo', 'valid-dep-after'], function() {
  });


  throws(function() {
    require('bar');
  }, /I am a broken module/, 'The first time');

  throws(function() {
    require('bar');
  }, /I am a broken module/, 'The second time');
});

test('redefining a module when "new" replaces previous definition', function(assert) {
  var first = false;
  var second = false;

  define('foo', function() { first = true; });

  assert.equal(getModuleState('foo'), 'new', 'module is in "new" state');
  define('foo', function() { second = true; });

  require('foo');

  assert.notOk(first, 'first module definition never used');
  assert.ok(second, 'second module definition is used');
});

test('redefining a module when "pending" should no-op', function(assert) {
  assert.expect(3);

  var first = false;
  var second = false;

  define('foo', function() { first = true; });

  define('baz', function() {
    assert.equal(getModuleState('foo'), 'pending', 'module is in "pending" state');
    define('foo', function() { second = true; });
  });

  define('bar', ['baz', 'foo'], function() {});

  require('bar');
  require('foo');

  assert.ok(first, 'first module definition is used');
  assert.notOk(second, 'second module definition never used');
});

test('reify should release', function(assert) {
  define('foo', ['bar'], function() { });
  define('bar', ['bar'], function() { });

  require('foo');
  require('bar');

  assert.deepEqual(require.entries['foo'].reified, []);
  assert.deepEqual(require.entries['bar'].reified, []);

});
test('redefining a module when "reifying" should no-op', function(assert) {
  var first = false;
  var second = false;

  define('foo', ['bar'], function() { first = true; });

  define('bar', function() {
    assert.equal(getModuleState('foo'), 'reifying', 'module is in "reifying" state');
    define('foo', function() { second = true; });
  });

  require('foo');
  require('foo');

  assert.ok(first, 'first module definition is used');
  assert.notOk(second, 'second module definition never used');
});

test('redefining a module when "reified" should no-op', function(assert) {
  var first = false;
  var second = false;

  define('foo', function() {
    first = true;

    assert.equal(getModuleState('foo'), 'reified', 'module is in "reified" state');
    define('foo', function() { second = true; });
  });

  require('foo');
  require('foo');

  assert.ok(first, 'first module definition is used');
  assert.notOk(second, 'second module definition never used');
});

test('redefining a module when "errored" should no-op', function(assert) {
  assert.expect(4);

  var first = false;
  var second = false;

  define('foo', ['bar'], function() { first = true; });
  define('bar', function() { throw Error(); });
  try {
    require('foo');
  } catch (e) {}
  assert.notOk(first, 'first module definition never used');

  assert.equal(getModuleState('foo'), 'errored', 'module is in "errored" state');
  define('foo', function() { second = true; });
  try {
    require('foo');
  } catch (e) {
    assert.ok(true, 'first module definition used again and throws error again');
  }
  assert.notOk(second, 'second module definition never used');
});

test('redefining a module when "finalized" should no-op', function(assert) {
  var first = false;
  var second = false;

  define('foo', function() { first = true; });
  require('foo');
  assert.ok(first, 'first module definition is used');

  assert.equal(getModuleState('foo'), 'finalized', 'module is in "finalized" state');
  define('foo', function() { second = true; });
  require('foo');
  assert.notOk(second, 'second module definition never used');
});

test('define.exports', function(assert) {
  var defaultExport = { example: 'export' };
  define.exports('foo/bar', defaultExport);
  assert.equal(require('foo/bar'), defaultExport);
});

test('require.moduleId', function(assert) {
  define('foo', ['require'], function(require) {
    assert.equal(require.moduleId, 'foo');
    return require.moduleId;
  });

  define.alias('foo', 'foo/bar');
  assert.equal(require('foo/bar'), 'foo');
});
