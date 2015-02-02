'use strict';

var fs = require('fs');
var assert = require('assert');
var fetch = require('npm-fetch');
var rimraf = require('rimraf');
var Promise = require('promise');
var Symbol = require('es6-symbol');
var tar = require('tar-pack');
var RegClient = require('npm-registry-client');
var throat = require('throat');
var semver = require('semver');
var publish = require('./publish');
var registry = new RegClient({});

var registryBase = "http://registry.npmjs.org/";

var name = 'regenerator-runtime-only';

module.exports = update;
function update() {
  return Promise.all(['regenerator', name].map(getVersions)).then(function (res) {
    return res[0].filter(function (version) {
      return res[1].indexOf(version) === -1 && semver.gt(version, '0.8.5');
    }).reduce(function (acc, version) {
      return acc.then(function () {
        return buildAndPublish(version);
      });
    }, Promise.resolve(null));
  });
}
function getVersions(name) {
  return new Promise(function (resolve, reject) {
    registry.request(registryBase + name, {}, function (err, data) {
      if (err) return reject(err);
      resolve(Object.keys(data.versions));
    });
  });
}

var buildAndPublish = throat(1, function (version) {
  console.log('Downloading: ' + version);
  return download(version).then(function () {
    console.log('Building: ' + version);
    return build(version);
  }).then(function () {
    console.log('Testing: ' + version);
    return test(version);
  }).then(function () {
    console.log('Publishing: ' + version);
    return publish(__dirname + '/runtime');
  }).then(function () {
    console.log('Published: ' + version);
  });
});
function download(version) {
  rimraf.sync(__dirname + '/regenerator');
  rimraf.sync(__dirname + '/runtime');
  return new Promise(function (resolve, reject) {
    var dir = __dirname + '/regenerator';
    var tarball = fetch.npm.version('regenerator', version);
    tarball.pipe(tar.unpack(dir, {
      defaultName: false
    }, function (err) {
      if (err) reject(err);
      else resolve();
    }));
  });
}
function build(version) {
  fs.mkdirSync(__dirname + '/runtime');
  function copy(src, dest) {
    if (Array.isArray(src)) {
      src = src.map(function (filename) {
        return fs.readFileSync(__dirname + filename, 'utf8');
      }).join('\n');
    } else {
      src = fs.readFileSync(__dirname + src, 'utf8');
    }
    fs.writeFileSync(__dirname + dest, src);
  }
  copy('/regenerator/LICENSE', '/runtime/LICENSE');
  copy('/regenerator/runtime-module.js', '/runtime/index.js');
  copy(['/polyfill.js', '/regenerator/runtime.js'], '/runtime/runtime.js');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/runtime.json', 'utf8'));
  pkg.name = name;
  pkg.version = version;
  fs.writeFileSync(__dirname + '/runtime/package.json', JSON.stringify(pkg, null, '  '));
  copy('/README.md', '/runtime/README.md');
}
function test(version) {
  // smoke tests
  var regeneratorRuntime = require('./runtime/');
  assert.strictEqual(typeof regeneratorRuntime.wrap, "function");
  assert.strictEqual(typeof regeneratorRuntime.mark, "function");
  var foo = regeneratorRuntime.mark(function foo() {
    return regeneratorRuntime.wrap(function foo$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          context$1$0.next = 2;
          return 10;
        case 2:
          context$1$0.next = 4;
          return 5;
        case 4:
        case "end":
          return context$1$0.stop();
      }
    }, foo, this);
  });

  var sum = 0;
  for (var _iterator = foo()[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
    var x = _step.value;
    sum += x;
  }

  assert(sum === 15);

  function bar() {
    var res;
    return regeneratorRuntime.async(function bar$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          context$1$0.next = 2;
          return Promise.resolve(42);
        case 2:
          res = context$1$0.sent;
          return context$1$0.abrupt("return", res);
        case 4:
        case "end":
          return context$1$0.stop();
      }
    }, null, this);
  }
  return bar().then(function (res) {
    assert.strictEqual(res, 42);
  });
}
