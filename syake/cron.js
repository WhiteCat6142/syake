var request = require('request');
var api = require('./api2');
var http = require('http');
var zlib = require('zlib');

var nodes = ["localhost:8080/server.cgi"];
exports.nodes=nodes;

Object.observe(api.recent,function(changes){
	var change=changes[0];
	if(change.type!="update")return;
	if(change.name!="last")return;
	for(var i=0;i<nodes.length;i++)get((nodeUrl(nodes[i],"update")+"/"+change.object.last+"/:3000+server.cgi"));
});

function update(file,stamp,id,node){
	console.log("update:"+file+stamp+id+node);
	api.thread.get(file,{time:stamp,id:id}).then(function(rows){
		if(rows.length!=0)return;
		readLine(nodeUrl(node,"get")+"/"+file+"/"+stamp+"/"+id,function(body){
			var x = body.match(/(\d+)<>(.{32})<>(.*)/);
			if(x&&stamp==x[1]&&id==x[2])api.thread.post(file,stamp,id,x[3]);
		});
	});
}
function readHead(node,file){
	api.thread.get(file,{time:time()}).then(function(rows){
		var list=new Array(rows.length);
		for(var i=0;i<rows.length;i++){
			list[i]=rows[i].stamp+"<>"+rows[i].id;
		}
		readLine(nodeUrl(node,"head")+"/"+file+"/"+time(),function(body){
			if(list.indexOf(body)==-1){
				var x=body.split("<>");
				update(file,x[0],x[1],node);
			}
		});
	});
}
function readNode(node){
	api.threads.get({time:time()}).then(function(rows){
		readLine(nodeUrl(node,"recent")+"/"+time(),function(body){
			var x = body.split("<>");
			for(var i=0;i<rows.length;i++){
				if(rows[i].file==x[2]){
					if(rows[i].laststamp!=x[0]||rows[i].lastid!=x[1])readHead(node,x[2]);
					return;
				}
			}
		});
	});
}
function readAll(){
	for(var i=0;i<nodes.length;i++)readNode(nodes[i]);
}

function get(url){
	return new Promise(function(resolve, reject){
		console.log(url);
		var request=http.request(url, function(res){
				var bufs = []; 
				res.on('data', function(chunk){bufs.push(chunk);});
				res.on('end', function(){
					var data = Buffer.concat(bufs);
					if(res.headers["Content-Encoding"]=="gzip"){
						zlib.gunzip(data, function (err, binary) {
							var body = binary.toString('utf-8');
							resolve(body);
						});
					}else{resolve(data.toString('utf-8'));}
				});
		});
		request.on('error', function(e){reject(e);});
		request.setHeader("accept-encoding","gzip");
		request.end();
	});
}
function readLine(url,callback){
	return get(url).then(function(body){
		var x = body.split(/\r\n|\r|\n/);
		for(var i=0;i<x.length;i++){callback(x[i]);}
	});
}

var range = 60*60*24*7;
function time(){
	return (Math.round(new Date().getTime()/1000)-range)+"-";
}

exports.ping = function(node){
	return new Promise(function(resolve, reject){
		get(nodeUrl(node,"ping")).then(
			function(body){if(body.startsWith("PONG\n"))resolve(true);else reject(false);},
			function(err){reject(false);}
		);
	});
};
exports.update=update;
exports.read=readNode;

function difference(a,b){
	return a.filter(function(element){
		return (b.indexOf(element)==-1);
	});
}

function nodeUrl(node,m){
	console.log(m+" "+node);
	return "http://"+node+"/"+m;
}