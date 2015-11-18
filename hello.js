var http = require('http');
var express = require('express');
var app = express();
var compression = require('compression');

config={vistor:"/:(127|10)\.[0-9\.]/"};

app.use(function(req, res, next){
console.log(req.ip + ' ' + req.url);
if(!req.ip.match(config.vistor)){next();}else{res.sendStatus(403);}
});

//app.use(compression());

app.use("/gateway.cgi",express.static('www',{maxAge:600}));

app.set('view engine', 'jade');
app.set('views', './views');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

var router = require('./syake/router');
app.use('/',router);

app.use(function(err, req, res, next){res.status(500).send(err.name + ": " + err.message);});
app.use(function(req, res, next){res.sendStatus(404);});

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});