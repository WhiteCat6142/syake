var api = require('./api2');
var http = require('http');
var zlib = require('zlib');
var cronJob = require('cron').CronJob;

var nodes = ["127.0.0.1:8080/server.cgi","node.shingetsu.info:8000/server.cgi","shingetsu.ygch.net:80/server.cgi"];
exports.nodes=nodes;

/*
api.update.on("update",function(file,stamp,id){
    for(var i=0;i<nodes.length;i++){
        get((nodeUrl(nodes[i],"update")+"/"+file+"/"+stamp+"/"+id+"/:3000+server.cgi"))
        .catch(function(err){
		console.log("bye "+nodes[i]);
        delete nodes[i];
        });
     }
});
*/

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
function readAll(node,file){
    api.threads.create(api.getTitle(file));
    readLine(nodeUrl(node,"get")+"/"+file+"/0-",function(body){
        var x = body.match(/(\d+)<>(.{32})<>(.*)/);
        api.thread.post(file,x[1],x[2],x[3]);
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
	api.threads.get({}).then(function(rows){
		readLine(nodeUrl(node,"recent")+"/"+time(),function(body){
			var x = body.split("<>");
			for(var i=0;i<rows.length;i++){
				if(rows[i].file==x[2]){
					if(!(rows[i].laststamp==x[0]&&rows[i].lastid==x[1]))readHead(node,x[2]);
					return;
				}
			}
            api.notice(x[2],node)
		});
	});
}
var numt =0;
var cronTime = "00 */3 * * * *";
var job = new cronJob({
    cronTime: cronTime,
    onTick:function(){
        //for(var i=0;i<nodes.length;i++)readNode(nodes[i]);
        readNode(nodes[numt%nodes.length]);
        numt++;
        numt%=10000;
    },
    start: false
});
job.start();


function get(url){
	return new Promise(function(resolve, reject){
		console.log(url);
		var request=http.request(url, function(res){
				var bufs = []; 
				res.on('data', function(chunk){bufs.push(chunk);});
				res.on('end', function(){
					var data = Buffer.concat(bufs);
					if(res.headers["content-encoding"]=="gzip"){
						zlib.gunzip(data, function (err, binary) {
							var body = binary.toString('utf-8');
							resolve(body);
						});
					}else{resolve(data.toString('utf-8'));}
				});
		});
		request.on('error', function(e){reject(e);});
		request.setHeader("accept-encoding","gzip");
		request.setHeader('user-agent','shinGETsu/0.7 (Syake/0.4.0)');
		request.end();
	});
}
function readLine(url,callback){
	return get(url).then(function(body){
		var x = body.split(/\r\n|\r|\n/);
		for(var i=0;i<x.length;i++){if(x[i])callback(x[i]);}
	}).catch(function(e){if(e.code!="ECONNREFUSED")console.log(e);});
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
exports.readAll=readAll;

function nodeUrl(node,m){
	console.log(m+" "+node);
	return "http://"+node+"/"+m;
}