#!/usr/bin/env node

var Tail = require('tail').Tail,
  parser = require('clf-parser'),
  express = require('express'),
  os = require('os');
var argv = require('yargs').argv;

var port = argv.port || 1337;
var path = argv.path || argv.log || '/var/log/nginx/access.log';

var app = express();
app.use(express.static(__dirname + '/static'));

var server = require('http').Server(app),
  io = require('socket.io')(server),
  tail = new Tail(path);

var requests = [];

tail.on("line", function(data) {
  var req = parser(data);

  //console.log(req);

  if (req.status !== undefined && req.body_bytes_sent !== undefined && req.http_method !== undefined) {
    var aux = {};

    aux.status = req.status;
    aux.body_bytes_sent = req.body_bytes_sent;
    aux.http_method = req.http_method;

    requests.push(aux);
  }
});

tail.on("error", function(error) {
  console.log('TAIL ERROR: ', error);
});

setInterval(function() {
  io.sockets.emit('data', {
    'info': {
      'load': os.loadavg(),
      'totalmem': os.totalmem(),
      'freemem': os.freemem(),
      'loadpercentage': parseInt((os.loadavg()[0] * 100) / os.cpus().length)
    },
    'requests': requests
  });
  requests = [];
}, 1000);

server.listen(port);

io.on('connection', function(socket) {
  console.log('Client connected');
});

console.log('########################');
console.log('dashode');
console.log('########################');
console.log('Server started!');
console.log('Listening on port: ' + port);
console.log('Watching log: ' + path);
console.log('----');
