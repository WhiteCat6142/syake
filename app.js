var http = require('http');
var express = require('express');
var app = express();
var compression = require('compression');
var logger = require("morgan");
var jade = require("jade");

var config=require("./syake/api2").config=require("./autosaver").sync("./file/config.json","json",{readonly:true});

app.use(function(req, res, next){
  if(req.ip.match(config.vistor)){next();}else{res.sendStatus(403);}
});

app.use(logger('dev'));

app.use(require("./comp-cache").get);

app.use(compression({threshold:0}));

app.use("/",express.static('www',{maxAge:86400000*7}));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'jade');
app.set('views', './views');

//var options = {cache: true};
/*
jade.compileFile('./views/base.jade', options);
jade.compileFile('./views/index.jade', options);
jade.compileFile('./views/bbs.jade', options);
*/

require('./syake/gateway').set(app);

var admin = express.Router();
app.use("/admin.cgi",admin);
require('./syake/admin').set(admin);

var server = express.Router();
app.use("/server.cgi",server);
require('./syake/server').set(server);

require('./syake/dat').set(app);

//require('./syake/apollo');

//app.use(function(err, req, res, next){res.status(500).end(err.name + ": " + err.message+err);console.log(err);});
app.use(function(req, res, next){res.sendStatus(404);});

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});