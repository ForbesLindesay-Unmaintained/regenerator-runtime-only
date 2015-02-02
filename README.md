# regenerator-runtime-only

Just the runtime part of regenerator.  If your publishing a module to npm that relies on `regenerator`, This allows you to include the runtime without also making people download the entire regenerator library (complete with AST transformers and parsers etc.).

This module is automatically re-built and published by a bot that polls npm every 10 minutes.  You can check the status of the bot by navigating to [regenerator-runtime-bot.jepso.com](https://regenerator-runtime-bot.jepso.com)

## Installation

    npm install regenerator-runtime-only

## Usage


```js
var regeneratorRuntime = require('regenerator-runtime-only');

function* foo() {
  yield 10;
  yield 32;
}
var gen = foo();
assert(gen.next() + gen.next() === 42);
```

Then run `regenerator src.js > index.js` and the resulting output will only need to load `regnerator-runtime-only`.  If ES6 features are unavailable, it will also load [es6-symbol](https://www.npmjs.com/package/es6-symbol) and [Promise](https://www.npmjs.org/package/promise) but it will not polyfill either feature on the glo al, and will prefer existing polyfills over these libraries.

## License

  MIT
