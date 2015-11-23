var express = require('express');

var app = express.Router();
var db = require('./gateway');
app.get('/',db.index);
app.get('/gateway.cgi',db.index);
app.get('/gateway.cgi/changes',db.changes);
app.get('/thread.cgi/:id',db.thread);
app.post('/thread.cgi',db.post);
app.post('/test/bbs.cgi',db.post);

var server = express.Router();
app.use("/server.cgi",server);
var p = require('./server');
server.get('/ping',p.ping);
server.get('/node',p.node);
server.get('/join/:node',p.join);
server.get('/bye/:node',p.bye);
server.get('/have/:file',p.have);
server.get('/get/:file/:time',p.get);
server.get('/head/:file/:time',p.head);
server.get('/update/:file/:time/:id/:node',p.update);
server.get('/recent/:time',p.recent);

module.exports = app;