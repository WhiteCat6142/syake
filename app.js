var http = require('http');
var express = require('express');
var app = express();
var compression = require('compression');
var logger = require("morgan");
var jade = require("jade");
var api = require("./syake/api2");
var cache = require("./comp-cache");

api.config=require("./autosaver").sync("./file/config.json","json",{readonly:true});

app.use(function(req, res, next){
  if(req.ip.match(api.config.vistor)){next();}else{res.sendStatus(403);}
});

app.use(logger('dev'));

app.use(cache.get);
app.use(cache.put);
api.update.on("update",cache.clear);
api.update.on("notice",cache.clear);

app.use(compression({threshold:0}));

app.use("/",express.static('www',{maxAge:86400000*7}));
app.use("/file",express.static('cache',{maxAge:86400000*7}));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'jade');
app.set('views', './views');

var options = {cache: true};

jade.compileFile('./views/base.jade', options);
jade.compileFile('./views/index.jade', options);
jade.compileFile('./views/bbs.jade', options);


var admin = express.Router();
app.use("/admin.cgi",admin);
require('./syake/admin').set(admin);

var server = express.Router();
app.use("/server.cgi",server);
require('./syake/server').set(server);

var dat = express.Router();
app.use("/",dat);
require('./syake/dat').set(dat);

var gateway = express.Router();
app.use("/",gateway);
require('./syake/gateway').set(gateway);

//require('./syake/apollo');

//app.use(function(err, req, res, next){res.status(500).end(err.name + ": " + err.message+err);console.log(err);});
app.use(function(req, res, next){res.sendStatus(404);});

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});