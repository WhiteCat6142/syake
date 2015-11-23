var api = require('./api');
var nodes = [];

exports.ping = function(req, res) {res.end("PONG\n"+req.ip);};
exports.node = function(req, res) {res.end(nodes.join(","));};
exports.join  = function(req, res) {
 var pos = nodes.indexOf(req.params.node);
 if(pos==-1)nodes.push(req.params.node);
 res.end("WELCOME");
};
exports.bye = function(req, res) {
 var pos = nodes.indexOf(req.params.node);
 nodes.splice(pos, 1);
 res.end("BYEBYE");
};
exports.have = function(req, res) {};
exports.get = function(req, res) {};
exports.head = function(req, res) {};
exports.update = function(req, res) {};
exports.recent = function(req, res) {};