'use strict';

var ms = require('ms');
var bot = require('./build.js');


var settings = 'last-reboot:  ' + (new Date()).toISOString();
var lastRun = 'no old runs to display'
var lastStart = 'never started'
var lastEnd = 'never finished'

var log = [];
var oldLog = console.log;
console.log = function (msg) {
  oldLog.apply(console, arguments);
  log.push(msg);
  while (log.length > 20) {
    log.shift();
  }
};
function onError(err) {
  console.log(err.stack || err.message || err);
}

function run() {
  lastStart = (new Date()).toISOString();
  return bot().then(function () {
    lastEnd = (new Date()).toISOString()
  });
}
maintain()
function maintain() {
  run().done(function () {
    if (lastEnd != 'never finished') {
      lastRun = ms(new Date(lastEnd).getTime() - new Date(lastStart).getTime());
    }
    setTimeout(maintain, ms('10m'));
  }, function (err) {
    onError(err);
    setTimeout(maintain, ms('10m'));
  })
}

var http = require('http')

http.createServer(function (req, res) {
  var status = 200;
  if (lastEnd === 'never finished') {
    status = 503
  } else if (Date.now() - (new Date(lastEnd)).getTime() > ms('120 minutes')) {
    status = 503
    onError('Timeout triggering restart');
    setTimeout(function () {
      // allow time for the error to be logged
      process.exit(1);
    }, 500);
  }
  res.writeHead(status, {'Content-Type': 'text/plain'})
  var warning = status === 503 ? 'WARNING: server behind on processing\n\n' : ''
  var currentRun = lastStart > lastEnd ? ms(Date.now() - new Date(lastStart).getTime()) : '-'
  res.end(warning + settings + '\n\n' +
          'last-start:   ' + lastStart + '\n' +
          'last-end:     ' + lastEnd + '\n' +
          'pervious-run: ' + lastRun + '\n' +
          'current-run:  ' + currentRun + '\n' +
          'current-time: ' + (new Date()).toISOString() + '\n\n' +
          'Sever Log:\n\n' + log.join('\n'));
}).listen(process.env.PORT || 3000);

console.log('Server running at http://localhost:' + (process.env.PORT || 3000));
