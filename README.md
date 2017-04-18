loader.js [![Build Status](https://travis-ci.org/ember-cli/loader.js.png?branch=master)](https://travis-ci.org/ember-cli/loader.js)
=========

Minimal AMD loader mostly stolen from [@wycats](https://github.com/wycats).

## No Conflict

To prevent the loader from overriding `require`, `define`, or `requirejs` you can instruct the loader
to use no conflict mode by providing it an alternative name for the various globals that are normally used.

Example:

```js
loader.noConflict({
  define: 'newDefine',
  require: 'newRequire'
});
```

Note: To be able to take advantage of alternate `define` method name, you will also need to ensure that your
build tooling generates using the alternate.  An example of this is done in the [emberjs-build](https://github.com/emberjs/emberjs-build)
project in the [babel-enifed-module-formatter plugin](https://github.com/emberjs/emberjs-build/blob/v0.4.2/lib/utils/babel-enifed-module-formatter.js).

## Public API

`loader.js` provides the following as named exports from a `loader` module:

```ts
interface LoaderModule {
  /*
    Return the list of module id's that are present in the registry
  */
  getIds(): string[];

  /*
    Returns `true` if a module was found for the given module id.
    If the `id` provided is relative, it is resolved relative to
    the current module before checking the registry.
  */
  has(idOrRelativeName: string): boolean;

  /*
    Adds a new module for the provided module id.
  */
  define(id: string, dependencies?: string[], callback: Function): void;

  /*
    Returns the exports of the module id provided. If the provided id was
    relative, it is resolved relative to the current module first.
  */
  require(idOrRelativeName: string): any;

  /*
    Resolves a relative module name from the current module.
  */
  resolve(relativeName: string): string
}
```

In order to interact with `loader.js` from within a module, you should add `loader` as a dependency to your module.

When using ES modules that would look like:

```js
import {
  has,
  getIds,
  define,
  require,
  resolve
} from 'loader';
```

Or if using `AMD` it would look like:

```js
define(['loader'], function(loader) {
  const {
    has,
    getIds,
    define,
    require,
    resolve
  } = loader;
});
```

## wrapModules

It is possible to hook loader to augment or transform the loaded code.  `wrapModules` is an optional method on the loader that is called as each module is originally loaded.  `wrapModules` must be a function of the form `wrapModules(name, callback)`. The `callback` is the original AMD callback.  The return value of `wrapModules` is then used in subsequent requests for `name`

This functionality is useful for instrumenting code, for instance in code coverage libraries.

```js
loader.wrapModules = function(name, callback) {
            if (shouldTransform(name) {
                    return myTransformer(name, callback);
                }
            }
            return callback;
    };
```

## Tests

We use [testem](https://github.com/airportyh/testem) for running our test suite.

You may run them with:
```sh
npm test
```

You can also launch testem development mode with:
```sh
npm run test:dev
```

## License

loader.js is [MIT Licensed](https://github.com/ember-cli/loader.js/blob/master/LICENSE.md).
