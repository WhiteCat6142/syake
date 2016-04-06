"use strict";

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('record.sqlite3');
const crypto = require('crypto');
const escape = require('escape-html');
const EventEmitter = require('events').EventEmitter;
const request = require('request');
const fs = require('fs');
const au = require("../autosaver");

function sqlGet(file,option,o){
	return new Promise(function(resolve, reject){
        o=o||"*";
		db.all("SELECT "+o+" FROM "+file+option,function(err,rows){
			if(!err){resolve(rows);}else{reject(err);}
		});
	});
}

exports.recent=[];

exports.update=new EventEmitter();

exports.unkownThreads=[];
exports.deleted=[];

exports.config=undefined;

var spamt=au.read("file/spam.txt","txt");

exports.threads = {
	get:function(option){
		var s="";
        var o="";
		if(option.time)s+=times(option.time);
		if(option.sort)s+=" order by stamp desc";
		if(option.limit)s+=" limit "+option.limit;
        if(option.tag){o="*,group_concat(tag) as tags";
        s+" join (select tag.tag,ttt.id from ttt join tag on ttt.tag = tag.id) on tid=id group by tid;";}
        if(option.addDate)return sqlGet("threads",s).then(exports.addDate);
		return sqlGet("threads",s);
	},
	create:function(title){
      const t = now();
	  const dat = t;
	  const file = threadFile(title);
      const l=exports.unkownThreads;
      for(var i=0;i<l.length;i++){
          if(l[i].file==file){l.splice(i,1);}
      }
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
			if(rows.length==1&&rows[0].records>0)return Promise.resolve(rows[0]);
			return Promise.reject();
		});
	}
};
exports.thread = {
	get:function(file,option){
		var s = "";
		if(option.time)s+=times(option.time);
		if(option.id)s+=((s)?" and":" where")+" id = \""+option.id+"\"";
		if(option.limit&&option.offset)s+=((s)?" and":" where")+" rowid between "+option.offset+" and "+(option.limit+option.offset-1);
		return sqlGet(file,s+" order by stamp asc");
	},
	post:function(file,stamp,id,body){
		if(!body)throw new Error("Empty Message");
        var ss=spamt.data.split("[\n\r]+");
        for(var s of ss){
        if(body.match(s)){
            db.run("INSERT INTO spam(id) VALUES(?)",id);
            console.log("spam:"+body);
        }
        }
		const md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
		if(id){if(md5!=id)throw new Error("Abnormal MD5");}
		else{id=md5;}
        add(file,stamp,id,body);
	}
};

exports.spam=function(id){
    return sqlGet("spam"," where id='"+id+"'").then(function(rows){
        if(rows.length==0)return Promise.resolve();
        else return Promise.reject();
    });
};

exports.post=function(file,name,mail,body,time,subject){
//if(subject)exports.threads.create(subject);
const porto=exports.config.porto;
    if(porto){
        const req ={cmd:"post",file:file,name:name,mail:mail,body:body,dopost:"dopost",error:""};
        request.post(porto,{form:req});
        return;
    }
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
                    if(rows.length==0){
                         if(content.indexOf("attach:")!=-1){
                            const suffix = content.match(/suffix:([^(<>)]*)/)[1];
                            const attach = content.match(/attach:([^(<>)]*)/)[1];
                            const data = new Buffer(attach,"base64");
                            const md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                            const name = md5+"."+suffix;
                            content = content.replace(/attach:[^(<>)]*/g,("attach:"+name));
                            console.log(name);
                            fs.writeFile("./cache/"+name,data,function(err){if(err)console.log(err);});
                         }
                         exports.update.emit('update',file,stamp,id,content);
                         db.serialize(function() {
                          db.run("UPDATE threads set stamp=?, records=records+1, laststamp=?, lastid=? where file = ?", now(), stamp, id, file);
		                  db.run("INSERT INTO "+file+" VALUES(?,?,?)", stamp, id, content);
                          resolve();
                         });
                    }else{
                        resolve();
                    }
            }).catch(function(err){reject(err);});
        });
}

exports.update.on("update",function(file,stamp,id,content){
    console.log(file,stamp,id,content.substring(0,16));
    exports.recent.push({
        title:exports.getTitle(file),
        file:file,
        stamp:stamp,
        id:id,
        content:content
    });
    cleanRecent();
});
function cleanRecent(){
    const list = exports.recent;
    const t = now()-24*60*60*7;
    while(list[0].stamp<t){
        list.shift();
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
            //var timeout = new Promise(function(resolve, reject) {setTimeout(reject,3000);});
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
	return rows;
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
			var x = content[j].match(/([a-z_]*):(.*)/);
			if(x)r[i][x[1]]=x[2];
		}
        r[i].body=r[i].body||"";
	}
	return r;
};

exports.attach=function(rows){
    try{
    for(var i=0;i<rows.length;i++){
        var s = rows[i].content;
        if(s.indexOf("attach:")==-1)continue;
        var j = s.match(/attach:([^(<>)]*)/);
        var buf = fs.readFileSync("./cache/"+j[1]);
        rows[i].content=s.replace(/attach:([^(<>)]*)/,buf.toString("base64"));
    }
    }catch(e){console.log(e);}
    return rows;
};

exports.notice=function(file,node){
    const unkownThreads = exports.unkownThreads;
    for(var i=0;i<unkownThreads.length;i++){
        if(unkownThreads[i].file==file)return;
    }
    const title = exports.getTitle(file);
    unkownThreads.push({node:node.replace(/\//g,"+"),file:file,title:title});
    exports.update.emit("notice",file,title,node);
};

exports.host=function(req) {
    return "http://"+req.hostname+":3000"
};

function encode(s){
    return new Buffer(s).toString("hex").toUpperCase();
}
function threadFile(title){return "thread_"+encode(title);};

function decode(s){
    return new Buffer(s.toLowerCase(),"hex").toString();
}
exports.getTitle = function(file){return decode(file.substring("thread_".length));};

function now(){return Math.round(new Date().getTime()/1000);}

function times(time){
	const x = time.split("-");
	var s=" where stamp ";
	if(x.length==1)return s+"= "+x[0];
	if(x[1]=="")return s+">= "+x[0];
	if(x[0]=="")return s+"<= "+x[1];
	return s+"between "+x[0]+" and "+x[1];
}