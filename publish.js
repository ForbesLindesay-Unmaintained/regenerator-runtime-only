'use strict';

var fs = require('then-fs');
var Promise = require('promise');
var RegClient = require('npm-registry-client');
var tar = require('tar-pack');
var registry = new RegClient({});

// returns {src, rfile}
function getReadme(directory, cb) {
  return fs.readdir(directory).then(function (files) {
    var rfile = files.filter(function (file) {
      return /^readme(\.(md|markdown|txt))?$/i.test(file)
    }).sort()[0]
    if (!rfile) throw new Error('No readme found');
    return fs.readFile(rfile, 'utf8').then(function (src) {
      return {src: src, file: rfile};
    })
  });
}
function prepare(directory) {
  // returns pkg
  var readme = getReadme(directory);
  var pkg = fs.readFile(directory + '/package.json', 'utf8').then(JSON.parse);

  return Promise.all([readme, pkg]).then(function (res) {
    var readme = res[0];
    var pkg = res[1];
    pkg.readme = readme.src;
    pkg.readmeFile = readme.file;
    return pkg;
  });
}

function publish(directory) {
  var registryBase = "http://registry.npmjs.org/";
  var auth = {
    username: process.env.NPM_USERNAME,
    password: process.env.NPM_PASSWORD,
    email: process.env.NPM_EMAIL,
    alwaysAuth: true
  };
  return prepare(directory).then(function (pkg) {
    pkg._npmUser = {
      name  : auth.username,
      email : auth.email
    };
    var params = {
      metadata : pkg,
      access   : 'public',
      body     : tar.pack(directory),
      auth     : auth
    }
    return new Promise(function (resolve, reject) {
      registry.publish(registryBase, params, function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}
module.exports = publish;
