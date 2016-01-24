var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('record.sqlite3');
var crypto = require('crypto');
var escape = require('escape-html');
var EventEmitter = require('events').EventEmitter;
var request = require('request');

function sqlGet(file,option,o){
	return new Promise(function(resolve, reject){
		db.all("SELECT * FROM "+file+option,o,function(err,rows){
			if(!err){resolve(rows);}else{reject(err);}
		});
	});
}

exports.recent=[];

exports.update=new EventEmitter();

exports.unkownThreads=[];

exports.config=undefined;

exports.threads = {
	get:function(option){
		var s="";
		if(option.time)s+=times(option.time);
		if(option.sort)s+=" order by stamp desc";
		if(option.limit)s+=" limit "+option.limit;
		return sqlGet("threads",s);
	},
	create:function(title){
      var t = now();
	  var dat = t+".dat";
	  var file = threadFile(title);
      console.log("newThread:"+t+" "+dat+" "+file+" "+title)
 	  db.run("CREATE TABLE "+file+" (stamp int,id text,content text)");
 	  db.run("INSERT INTO threads(stamp,title,dat,file) VALUES(?,?,?,?)", t, title, dat, file);
	},
	info:function(option){
        var s = "";
		if(option.file)s+=" where file = \""+option.file+"\"";
		else if(option.title)s+=" where title = \""+option.title+"\"";
		else if(option.dat)s+=" where dat = \""+option.dat+"\"";
		return sqlGet("threads",s).then(function(rows){
			if(rows.length==1)return Promise.resolve(rows[0]);
			return Promise.reject();
		});
	}
};
exports.thread = {
	get:function(file,option){
		var s = "";
		if(option.time)s+=times(option.time);
		if(option.id)s+=((option.time)?" and":" where")+" id = \""+option.id+"\"";
        s+=" order by stamp asc";
		if(option.limit)s+=" limit "+option.limit;
		if(option.offset)s+=" offset "+option.offset;
		return sqlGet(file,s);
	},
	post:function(file,stamp,id,body){
		console.log(file,stamp,id,body.substring(0,16));
		if(!body)throw new Error("Empty Message");
		var md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
		if(id){if(md5!=id)throw new Error("Abnormal MD5");}
		else{id=md5;}
        add(file,stamp,id,body);
	}
};

exports.post=function(file,name,mail,body,time){
var config={};
    if(config.porto){
        var req ={cmd:"post",file:file,name:name,mail:mail,dopost:"dopost",error:""};
        console.log(req.body);
        request.post(config.porto,{form:req.body});
        return;
    }

// if(b.subject)api.threads.create(b.subject);
 var s = "";
 if(mail)s+="mail:"+mail+"<>";
 if(name)s+="name:"+name+"<>";
 s+="body:"+escape(body).replace(/\r\n|\r|\n/g,"<br>");
 exports.threads.info(file).then(function(row){
   exports.thread.post(row.file,time||now(),null,s);
 });  
};

function add(file,stamp,id,content){
    transaction(function(resolve, reject) {
            sqlGet(file," where stamp="+stamp+" and id=\""+id+"\"").then(function(rows){
                db.serialize(function() {
                    if(rows.length==0){
                        db.run("UPDATE threads set stamp=?, records=records+1, laststamp=?, lastid=? where file = ?", now(), stamp, id, file);
		                db.run("INSERT INTO "+file+" VALUES(?,?,?)", stamp, id, content);
                        exports.update.emit('update',file,stamp,id);
                        exports.recent.push({
                            title:exports.getTitle(file),
                            file:file,
                            stamp:stamp,
                            id:id,
                            content:content
                        });
                        cleanRecent();
                    }
                    resolve();
                });
            }).catch(function(err){reject();});
        });
}
function cleanRecent(){
    var list = exports.recent;
    var t = now()-24*60*60*7;
    for(var i=0;i<list.length;i++){
        if(list[i].stamp>t)return;
        list[i]=undefined;
    }
}

var nextAction =[];
function transaction(p){
    if(!p)return;
            db.exec("BEGIN EXCLUSIVE",function(err){
            if(err){
                nextAction.push(p);
                return;
            }
            new Promise(p).then(
                function(){db.exec("COMMIT");}
                ,function(err){db.exec("ROLLBACK");}
            ).then(function(){
                setImmediate(function(){
                    transaction(nextAction.shift());
                });
            });
            });
}

exports.addDate = function(rows){
	var time = "";
	for(var i=0;i<rows.length;i++){
		time = new Date(rows[i].stamp*1000).toString();
		rows[i].date = time.substring(0,time.lastIndexOf(" GMT"));
	}
	return Promise.resolve(rows);
};
exports.convert = function(rows){
	var r = new Array(rows.length);
	var time = "";
	var content=null;
	for(var i=0;i<rows.length;i++){
		time = new Date(rows[i].stamp*1000).toString();
		time = time.substring(0,time.lastIndexOf(" GMT"));
		r[i]={date:time,id:rows[i].id.substr(0,8)};
		content=rows[i].content.split("<>");		
		for(var j=0;j<content.length;j++){
			var x = content[j].match(/([a-z]*):(.*)/);
			if(x)r[i][x[1]]=x[2];
		}
	}
	return r;
};

exports.notice=function(file,node){
    var unkownThreads = exports.unkownThreads;
    for(var i=0;i<unkownThreads.length;i++){
        if(unkownThreads[i].file==file)return;
    }
    unkownThreads.push({node:node.replace(/\//g,"+"),file:file,title:exports.getTitle(file)});
}

function encode(s){
 var output = "";
 var x = 0;
 for(var i=0; i<s.length; ++i){
  x = s.charCodeAt(i);
  output += (x<0x80)?x.toString(16).toUpperCase():s.charAt(i);
 }
 return encodeURIComponent(output).replace(/%/g,"");
}
function threadFile(title){return "thread_"+encode(title);};

function decode(s){
 var output = "";
 for(var i=0; i<s.length; ++i){output+=((i%2==0)?"%":"")+s.charAt(i);}
 return decodeURIComponent(output);
}
exports.getTitle = function(file){return decode(file.substring("thread_".length));};

function now(){return Math.round(new Date().getTime()/1000);}

function times(time){
	var x = time.split("-");
	var s=" where stamp ";
	if(x.length==1)return s+"= "+x[0];
	if(x[1]=="")return s+">= "+x[0];
	if(x[0]=="")return s+"<= "+x[1];
	return s+"between "+x[0]+" and "+x[1];
}