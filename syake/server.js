"use strict";

const api = require('./api2');
const nodeManeger = require('./cron');
var nodes = nodeManeger.nodes;

function ping(req, res) {
	res.end("PONG\n"+req.ip);
}
function node(req, res) {
    res.end("");
	//res.end(nodes[Math.floor(Math.random()*nodes.length)]);
}
function join(req, res) {
 const node = req.node;
 res.end("WELCOME");
 nodeManeger.ping(node).then(function(isAlive){
	 if(nodes.indexOf(node)==-1)nodes.push(node);
 }).catch(onErr(res));
}
function bye(req, res) {
 const node = req.node;
 //if(!node.startsWith(req.ip))throw "ip doesn't match the node";
 const i=nodes.indexOf(node);
 if(i!=-1)delete nodes[i];
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
	api.thread.get(file,{time:req.params.time}).then(api.attach(file)).then(function(rows){
		for(var i=0; i<rows.length; i++){
			if(i>0)res.write("\n");
			res.write(rows[i].stamp+"<>"+rows[i].id+"<>"+rows[i].content);
		}
		res.end();
	});
}
function head(req, res) {
	api.thread.get(req.params.file,{time:req.params.time,head:true}).then(function(rows){
		for(var i=0; i<rows.length; i++){
			if(i>0)res.write("\n");
			res.write(rows[i].stamp+"<>"+rows[i].id);
		}
		res.end();
	});
}
function update(req, res) {
	res.end("OK");
	nodeManeger.update(req.params.file,req.params.stamp,req.params.id,req.node);
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
		if(ip.indexOf(":")!=-1)ip="["+ip+"]";
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
server.get('/update/:file/:stamp/:id/:node',update);
server.get('/recent/:time',recent);
server.use(function(err, req, res, next){res.end("");});
};