var express = require('express');
var app = express.Router();

var db = require('./gateway');
app.get('/',db.index);
app.get('/gateway.cgi',db.index);
app.get('/gateway.cgi/changes',db.changes);
app.get('/thread.cgi/:id',db.thread);
app.post('/thread.cgi',db.post);
app.post('/test/bbs.cgi',db.post);

module.exports = app;