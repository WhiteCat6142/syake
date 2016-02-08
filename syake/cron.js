var api = require('./api2');
var http = require('http');
var zlib = require('zlib');

var nodes = api.config.nodes;
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
    api.spam(id).then(function(){
	api.thread.get(file,{time:stamp,id:id}).then(function(rows){
		if(rows.length!=0)return;
		readLine(nodeUrl(node,"get")+"/"+file+"/"+stamp+"/"+id,function(body){
			var x = body.match(/(\d+)<>(.{32})<>(.*)/);
			if(x&&stamp==x[1]&&id==x[2])api.thread.post(file,stamp,id,x[3]);
		});
	});
    });
}
function readAll(node,file){
    api.threads.create(api.getTitle(file));
    readLine(nodeUrl(node,"get")+"/"+file+"/"+time(api.config.range.newThread),function(body){
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
        var num=0;
        var len=list.length;
        var next=[];
		readLine(nodeUrl(node,"head")+"/"+file+"/"+time(api.config.range.head),function(body){
            var i=list.indexOf(body);
			if(i==-1){
                next.push(body);
			}else{
                list[i]=undefined;
                num++;
            }
		},function(){
            var per=next.length;
            if(per==0)return;
            var c=false;
            if(len==0){c=(per>30);}else{c=((per*3>len)||(num*2<len));}
            if(c){
                console.log("immunity:"+len+" "+per+" "+num+" in "+node+" at "+file);
                return;
            }
            // when new>0 and old>0 , it must be new:old<=1:3 match:old>=1:2
            //limit new<=30
            for(var i=0;i<next.length;i++){
                var x = next[i].split("<>");
                update(file,x[0],x[1],node);
            }
        });
	});
}
function readNode(node,t){
	api.threads.get({}).then(function(rows){
        t = t||api.config.range.node;
		readLine(nodeUrl(node,"recent")+"/"+time(t),function(body){
			var x = body.split("<>");
			for(var i=0;i<rows.length;i++){
				if(rows[i]&&rows[i].file==x[2]){
					if(!(rows[i].laststamp==x[0]&&rows[i].lastid==x[1]))readHead(node,x[2]);
                    rows[i]=undefined;
					return;
				}
			}
            api.notice(x[2],node)
		});
	});
}

setInterval(function(){
        if(!this.numt||this.numt>=nodes.length)this.numt=0;
        readNode(nodes[this.numt++]);
},3*60*1000);//3m
if(api.config.range.first){
    var t = api.config.range.first;
    for(var i=0; i<nodes.length; i++){readNode(nodes[i],t);}
}


function get(url){
	return new Promise(function(resolve, reject){
		console.log(url);
		var request=http.request(url, function(res){
            if(res.statusCode!=200)reject(res.statusCode);
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
		request.setHeader('user-agent','shinGETsu/0.7 (Syake/0.12.0)');
		request.end();
	});
}
function readLine(url,callback,done){
	return get(url).then(function(body){
		var x = body.split(/\r\n|\r|\n/);
		for(var i=0;i<x.length;i++){if(x[i])callback(x[i]);}
        if(done)done();
	}).catch(function(e){
        console.log("error");
        if(e.code!="ECONNREFUSED"&&e.code!="ETIMEDOUT"&&e.code!="ENOTFOUND")console.log(e);
    });
}

var range = 7;
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

function nodeUrl(node,m){
	console.log(m+" "+node);
	return "http://"+node+"/"+m;
}