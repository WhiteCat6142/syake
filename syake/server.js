"use strict";

const api = require('./api2');
const nodeManeger = require('./cron');
const co = require('co');
const fs = require('fs');
const read = co.wrap(fs.readFile);
var nodes = nodeManeger.nodes;

function ping(req, res) {
	res.end("PONG\n"+req.ip);
}
function node(req, res) {
	var x = nodes.concat(api.config.friends);
	res.end(x[Math.floor(Math.random()*x.length)]);
}
function join(req, res) {
 const node = req.node;
 res.end("WELCOME");
 nodeManeger.addFriend(node);
}
function bye(req, res) {
 const node = req.node;
 //if(!node.startsWith(req.ip))throw "ip doesn't match the node";
 const n= api.config.friends;
 const i=n.indexOf(node);
 if(i!=-1)n.splice(i,1);
 res.end("BYEBYE");
}
function have(req, res) {
	api.threads.info({file:req.params.file}).then(
		function(){res.end("YES");},
		function(){res.end("NO");}
	);
}
function get(req, res) {
	const file=req.params.file;
	api.thread.get(file,{time:req.params.time,id:req.params.id}).then(attach(file)).then(function(rows){
		for(var i=0; i<rows.length; i++){
			if(i>0)res.write("\n");
			res.write(rows[i].stamp+"<>"+rows[i].id+"<>"+rows[i].content);
		}
		res.end();
	});
}
function attach(file) {
	if(!api.config.image)return function (rows) {return rows;}
    return function (rows) {
        return co(function* () {
            for (var i = 0; i < rows.length; i++) {
                var s = rows[i].content;
                if (s.indexOf("attach:") === -1) continue;
                var j = s.match(/attach:([^(<>)]*)/);
                var buf = yield read("./cache/" + file + "/" + j[1]);
                rows[i].content = s.replace(/attach:([^(<>)]*)/, "attach:" + buf.toString("base64"));
            }
            return rows;
        });
    };
}

function head(req, res) {
	api.thread.get(req.params.file,{time:req.params.time,id:req.params.id,head:true}).then(function(rows){
		for(var i=0; i<rows.length; i++){
			if(i>0)res.write("\n");
			res.write(rows[i].stamp+"<>"+rows[i].id);
		}
		res.end();
	});
}
function update(req, res) {
	res.end("OK");
	api.threads.info({file:req.params.file}).then(function(row){
		nodeManeger.update(req.params.file,req.params.stamp,req.params.id,req.node);
	},function() {});
}
function recent(req, res) {
	api.threads.get({time:req.params.time}).then(function(rows){
		for(var i=0; i<rows.length; i++){
			if(i>0)res.write("\n");
			res.write(rows[i].laststamp+"<>"+rows[i].lastid+"<>"+rows[i].file);
		}
		res.end();
	});
}

 function nodeString(req, res, next, node) {
	node = node.replace(/\+/,"/");
	if(node.lastIndexOf(":")==0){
		var ip = req.ip;
		if(ip.startsWith("::ffff:"))ip=ip.substr(7);
		else if(ip.indexOf(":")!=-1)ip="["+ip+"]";
		node=ip+node;
	}
	req.node=node;
	next();
 }

exports.set=function(server){
server.param('node',nodeString);
server.get('/ping',ping);
server.get('/node',node);
server.get('/join/:node',join);
server.get('/bye/:node',bye);
server.get('/have/:file',have);
server.get("/get/:file/:time",get);
server.get("/get/:file/:time/:id",get);
server.get('/head/:file/:time',head);
server.get("/head/:file/:time/:id",get);
server.get('/update/:file/:stamp/:id/:node',update);
server.get('/recent/:time',recent);
server.use(function(err, req, res, next){res.end("");});
};