var express = require('express');
var app = express.Router();

var url = require('url');
var qs = require('querystring');

var http = require('http');

var a = [{link:"/a",title:"a",num:1}];
var tags =["a","b","c"];
app.get('/', function(req, res) {
  res.render('index',{threads:a,tags:tags});
});

var db = require('./sql');
app.get('/',db.index);
app.post('/test/bbs.cgi',db.index);

module.exports = app;
/*
chat=["test"];

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/calc', function(req, res) {
  var x = url.parse(req.url, true);
  var a = x.query["a"];
  var b = x.query["b"];
  res.render('calc',{result:(a * b)});
});

app.get('/bbs', function(req, res) {
   res.render('bbs',{ip:chat.toString()});
});

app.post('/bbs', function(req, res) {
req.data = "";
req.on("readable", function () {if(tmp=req.read())req.data += tmp;});
req.on("end", function () {
var query = qs.parse(req.data);
chat.push(query.content);
res.redirect('/bbs');
});
});

app.get('/rss', function(req, res) {
var url = 'http://rss.rssad.jp/rss/forest/rss.xml';
res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
r=res;
var response = http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });
 
    res.on('end', function(res){
        //ret = JSON.parse(body);
        response = body;
r.write(body);
r.end();
    });
}).on('error', function(e){
    console.log(e.message); //ÉGÉâÅ[éû
});
});

*/