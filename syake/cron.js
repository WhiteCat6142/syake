"use strict";

const api = require('./api2');
const http = require('http');
const zlib = require('zlib');
const Url = require('url');

const nodes = api.config.nodes;
exports.nodes=nodes;

if(api.config.update){
api.update.on("update",function(file,stamp,id){
	const s="/"+file+"/"+stamp+"/"+id+"/:"+(process.env.PORT ||3000)+"server.cgi";
    for(var n of api.config.friends){
        get(nodeUrl(n,"update")+s);
     }
});
}

function update(file,stamp,id,node){
	console.log("update:"+file+" "+stamp+" "+id+" "+node);
    api.spam(id).then(function(){
	api.thread.get(file,{time:stamp,id:id,head:true}).then(function(rows){
		if(rows.length!=0)return;
		readLine(nodeUrl(node,"get",file)+"/"+stamp+"/"+id,function(body){
			const x = body.match(/(\d+)<>(.{32})<>(.*)/);
			if(x&&stamp==x[1]&&id==x[2])api.thread.post(file,stamp|0,id,x[3]);
		});
	});
    });
}
function readAll(node,file){
    api.threads.create(api.getTitle(file),function() {
    readLine(nodeUrl(node,"get",file,api.config.range.newThread),function(body){
        const x = body.match(/(\d+)<>(.{32})<>(.*)/);
        api.thread.post(file,x[1]|0,x[2],x[3]);
    });
	});
}
function readHead(node,file){
    const t = api.config.range.head;
	api.thread.get(file,{time:time(t),head:true}).then(function(rows){
		var list=new Array(rows.length);
		for(var i=0;i<rows.length;i++){
			list[i]=rows[i].stamp+"<>"+rows[i].id;
		}
        var num=0;
        const len=list.length;
        var next=[];
		readLine(nodeUrl(node,"head",file,t),function(body){
            var i=list.indexOf(body);
			if(i==-1){
                next.push(body);
			}else{
                list[i]=undefined;
                num++;
            }
		},function(){/*
            const per=next.length;
            if(per==0)return;
            const c=(per>30)||(len!=0)&&((num*3<len)||(per>len*30));
            //len 0:30 10:10 20:20
            if(false){
                console.log("immunity:"+len+" "+per+" "+num+" in "+node+" at "+file);
                return;
            }
            // when new>0 and old>0 , it must be new:old<=1:3 match:old>=1:2
            //limit new<=30*/
            for(var i=0;i<next.length;i++){
                var x = next[i].split("<>");
                update(file,x[0],x[1],node);
            }
        });
	});
}
function readNode(node,t){
    if(!node)return;
	api.threads.get({}).then(function(rows){
        t = t||api.config.range.node;
        var done =[];
		readLine(nodeUrl(node,"recent","",t),function(body){
			const x = body.split("<>");
			for(var i=0;i<rows.length;i++){
				if(rows[i]&&rows[i].file==x[2]){
                    if(done.indexOf(x[2])!=-1)return;
                    done.push(x[2]);
					if(!(rows[i].laststamp==x[0]&&rows[i].lastid==x[1]))readHead(node,x[2]);
					return;
				}
			}
            api.notice(x[2],node);
		});
	});
}

setInterval(function(){
        if(!this.numt||this.numt>=nodes.length)this.numt=0;
        readNode(nodes[this.numt++]);
},api.config.range.interval*1000);

setInterval(function(){
	for(var n of api.config.join)readLine(nodeUrl(n,"join"));
},30*60);

if(api.config.range.first){
    const t = api.config.range.first;
    for(var i=0; i<nodes.length; i++){readNode(nodes[i],t);}
}

const ag= new http.Agent({maxSockets:64});
function get(url){
	return new Promise(function(resolve, reject){
		const o=Url.parse(url);
		o.agent=ag;
		const request=http.request(o, function(res){
            if(res.statusCode!=200)reject(res.statusCode);
				var bufs = []; 
				res.on('data', function(chunk){bufs.push(chunk);});
				res.on('end', function(){
					const data = Buffer.concat(bufs);
					if(res.headers["content-encoding"]=="gzip"){
						zlib.gunzip(data, function (err, binary) {
							const body = binary.toString('utf-8');
							resolve(body);
						});
					}else{resolve(data.toString('utf-8'));}
				});
		});
		request.on('error', function(e){reject(e);});
		request.setHeader("accept-encoding","gzip");
		request.setHeader('user-agent','shinGETsu/0.35 (Syake/0.12.0)');
		request.end();
	});
}
function readLine(url,callback,done){
	return get(url).then(function(body){
		const x = body.split(/[\r\n]+/);
		for(var i=0;i<x.length;i++){if(x[i])callback(x[i]);}
        if(done)done();
	}).catch(function(e){
        if(e.code=="ECONNREFUSED"&&e.code=="ETIMEDOUT")return;
		console.log(e);
		console.log(url);
		if(api.config.del){
		var node = url.match(/http:\/\/(.*?\/.*?)\/.*/)[1];
		var i= nodes.indexOf(node);
		console.log("bye "+node+" "+i);
        delete nodes[i];
		}
    });
}

const range = 7;
function time(r){
	return (Math.round(new Date().getTime()/1000)-(r||range)*24*60*60)+"-";
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

function nodeUrl(node,m,file,t){
	if((m!="get")&&(m!="head"))console.log(m+" "+node+((file)?" "+file.substr(0,32):""));
    const s = ((file)?"/"+file:"")+((t)?"/"+time(t):"");
	return "http://"+node+"/"+m+s;
}