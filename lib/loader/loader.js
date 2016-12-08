var loader, define, requireModule, require, requirejs;

(function(global) {
  'use strict';

  var stats;

  // Save off the original values of these globals, so we can restore them if someone asks us to
  var oldGlobals = {
    loader: loader,
    define: define,
    requireModule: requireModule,
    require: require,
    requirejs: requirejs
  };

  requirejs = require = requireModule = function(name) {
    stats.require++;
    var pending = [];
    var mod = findModule(name, '(require)', pending);

    for (var i = pending.length - 1; i >= 0; i--) {
      pending[i].exports();
    }

    return mod.module.exports;
  };

  function resetStats() {
    stats = {
      define: 0,
      require: 0,
      reify: 0,
      findDeps: 0,
      modules: 0,
      exports: 0,
      resolve: 0,
      resolveRelative: 0,
      findModule: 0,
      pendingQueueLength: 0
    };
    requirejs._stats = stats;
  }


  resetStats();

  loader = {
    noConflict: function(aliases) {
      var oldName, newName;

      for (oldName in aliases) {
        if (aliases.hasOwnProperty(oldName)) {
          if (oldGlobals.hasOwnProperty(oldName)) {
            newName = aliases[oldName];

            global[newName] = global[oldName];
            global[oldName] = oldGlobals[oldName];
          }
        }
      }
    }
  };

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    };
  } else {
    _isArray = Array.isArray;
  }

  var registry = {};
  var seen = {};

  var uuid = 0;

  function unsupportedModule(length) {
    throw new Error('an unsupported module was defined, expected `define(name, deps, module)` instead got: `' +
                    length + '` arguments to define`');
  }

  var defaultDeps = ['require', 'exports', 'module'];

  function Module(name, deps, callback, alias) {
    stats.modules++;
    this.id        = uuid++;
    this.name      = name;
    this.deps      = !deps.length && callback.length ? defaultDeps : deps;
    this.module    = { exports: {} };
    this.callback  = callback;
    this.hasExportsAsDep = false;
    this.isAlias = alias;
    this.reified = new Array(deps.length);

    /*
       Each module normally passes through these states, in order:
         new       : initial state
         pending   : this module is scheduled to be executed
         reifying  : this module's dependencies are being executed
         reified   : this module's dependencies finished executing successfully
         errored   : this module's dependencies failed to execute
         finalized : this module executed successfully
     */
    this.state = 'new';

  }

  Module.prototype.makeDefaultExport = function() {
    var exports = this.module.exports;
    if (exports !== null &&
        (typeof exports === 'object' || typeof exports === 'function') &&
          exports['default'] === undefined && !Object.isFrozen(exports)) {
      exports['default'] = exports;
    }
  };

  Module.prototype.exports = function() {
    // if finalized, there is no work to do. If reifying, there is a
    // circular dependency so we must return our (partial) exports.
    if (this.state === 'finalized' || this.state === 'reifying') { return this.module.exports; }
    stats.exports++;

    if (loader.wrapModules) {
      this.callback = loader.wrapModules(this.name, this.callback);
    }

    this.reify();

    var result = this.callback.apply(this, this.reified);
    this.state = 'finalized';

    if (!(this.hasExportsAsDep && result === undefined)) {
      this.module.exports = result;
    }
    this.makeDefaultExport();
    return this.module.exports;
  };

  Module.prototype.unsee = function() {
    this.state = 'new';
    this.module = { exports: {} };
  };

  Module.prototype.reify = function() {
    if (this.state === 'reified') { return; }
    this.state = 'reifying';
    try {
      this.reified = this._reify();
      this.state = 'reified';
    } finally {
      if (this.state === 'reifying') {
        this.state = 'errored';
      }
    }
  };

  Module.prototype._reify = function() {
    stats.reify++;
    var reified = this.reified.slice();
    for (var i = 0; i < reified.length; i++) {
      var mod = reified[i];
      reified[i] = mod.exports ? mod.exports : mod.module.exports();
    }
    return reified;
  };

  Module.prototype.findDeps = function(pending) {
    if (this.state !== 'new') {
      return;
    }

    stats.findDeps++;
    this.state = 'pending';

    var deps = this.deps;

    for (var i = 0; i < deps.length; i++) {
      var dep = deps[i];
      var entry = this.reified[i] = { exports: undefined, module: undefined };
      if (dep === 'exports') {
        this.hasExportsAsDep = true;
        entry.exports = this.module.exports;
      } else if (dep === 'require') {
        entry.exports = this.makeRequire();
      } else if (dep === 'module') {
        entry.exports = this.module;
      } else {
        entry.module = findModule(resolve(dep, this.name), this.name, pending);
      }
    }
  };

  Module.prototype.makeRequire = function() {
    var name = this.name;
    var r = function(dep) {
      return require(resolve(dep, name));
    };
    r['default'] = r;
    r.has = function(dep) {
      return has(resolve(dep, name));
    };
    return r;
  };

  define = function(name, deps, callback) {
    stats.define++;
    if (arguments.length < 2) {
      unsupportedModule(arguments.length);
    }

    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }

    if (callback instanceof Alias) {
      registry[name] = new Module(callback.name, deps, callback, true);
    } else {
      registry[name] = new Module(name, deps, callback, false);
    }
  };

  // we don't support all of AMD
  // define.amd = {};
  // we will support petals...
  define.petal = { };

  function Alias(path) {
    this.name = path;
  }

  define.alias = function(path) {
    return new Alias(path);
  };

  function missingModule(name, referrer) {
    throw new Error('Could not find module `' + name + '` imported from `' + referrer + '`');
  }

  function findModule(name, referrer, pending) {
    stats.findModule++;
    var mod = registry[name] || registry[name + '/index'];

    while (mod && mod.isAlias) {
      mod = registry[mod.name];
    }

    if (!mod) { missingModule(name, referrer); }

    if (pending && mod.state !== 'pending' && mod.state !== 'finalized') {
      mod.findDeps(pending);
      pending.push(mod);
      stats.pendingQueueLength++;
    }
    return mod;
  }

  function resolve(child, name) {
    stats.resolve++;
    if (child.charAt(0) !== '.') { return child; }
    stats.resolveRelative++;

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase = nameParts.slice(0, -1);

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') {
        if (parentBase.length === 0) {
          throw new Error('Cannot access parent module of root');
        }
        parentBase.pop();
      } else if (part === '.') {
        continue;
      } else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  function has(name) {
    return !!(registry[name] || registry[name + '/index']);
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.has = has;
  requirejs.unsee = function(moduleName) {
    findModule(moduleName, '(unsee)', false).unsee();
  };

  requirejs.clear = function() {
    resetStats();
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = {};
  };

  // prime
  define('foo',      function() {});
  define('foo/bar',  [], function() {});
  define('foo/asdf', ['module', 'exports', 'require'], function(module, exports, require) {
    if (require.has('foo/bar')) {
      require('foo/bar');
    }
  });
  define('foo/baz',  [], define.alias('foo'));
  define('foo/quz',  define.alias('foo'));
  define('foo/bar',  ['foo', './quz', './baz', './asdf', './bar', '../foo'], function() {});
  define('foo/main', ['foo/bar'], function() {});

  require('foo/main');
  require.unsee('foo/bar');

  requirejs.clear();

  if (typeof exports === 'object' && typeof module === 'object' && module.exports) {
    module.exports = { require: require, define: define };
  }
})(this);
