var http = require('http');
var express = require('express');
var app = express();
var compression = require('compression');
var logger = require("morgan");

config={vistor:"/:(127|10)\.[0-9\.]/"};

app.use(function(req, res, next){
if(!req.ip.match(config.vistor)){next();}else{res.sendStatus(403);}
});

app.use(compression({threshold:0}));

app.use(logger('dev'));

app.use("/gateway.cgi",express.static('www',{maxAge:86400000*7,eflag:false}));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'jade');
app.set('views', './views');

var router = require('./syake/router');
app.use('/',router);

app.use(function(err, req, res, next){res.status(500).send(err.name + ": " + err.message);});
app.use(function(req, res, next){res.sendStatus(404);});

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});