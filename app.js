"use strict";

const http = require('http');
const express = require('express');
const app = express();
const compression = require('compression');
const logger = require("morgan");
const jade = require("jade");
const api = require("./syake/api2");
const cache = require("comp-cache");

app.use(function(req, res, next){
  if(!api.host)api.host="http://"+req.hostname;
  if(req.ip.match(api.config.vistor)){next();}else{res.sendStatus(403);}
});

app.use("/file",express.static('cache',{maxAge:86400000*31,etag:false,lastModified:false}));
app.use(compression({threshold:0}));
app.use("/",express.static('www',{maxAge:86400000*7}));

app.use(logger('combined',{
  skip: function (req, res) { return req.path.startsWith("/server.cgi"); }
}));

app.use(cache.get);
app.use(cache.put);
const fs = require("fs");
fs.watch('views', function (event, path0) {
		if (event !== "change") return;
  cache.clear();
});
api.update.on("update",cache.clear);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'jade');
app.set('views', './views');

setTimeout(function(){
const options = {cache: true};
jade.compileFile('./views/base.jade', options);
},250);

const admin = express.Router();
app.use("/admin.cgi",admin);
require('./syake/admin').set(admin);

const server = express.Router();
app.use("/server.cgi",server);
require('./syake/server').set(server);

const dat = express.Router();
app.use("/",dat);
require('./syake/dat').set(dat);

const gateway = express.Router();
app.use("/",gateway);
require('./syake/gateway').set(gateway);

//require('./syake/apollo');

app.use(function(err, req, res, next){res.status(500).end(err.name + ": " + err.message+err);console.log(err);});
app.use(function(req, res, next){res.sendStatus(404);});

http.createServer(app).listen(process.env.PORT ||3000, function(){
  console.log("Express server started");
});