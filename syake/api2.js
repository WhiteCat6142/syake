"use strict";

const pg = require('pg');
pg.defaults.ssl = true;

const crypto = require('crypto');
const escape = require('escape-html');
const EventEmitter = require('events').EventEmitter;
//const request = require('request-lite');
const fs = require('fs');
const au = require("../autosaver");
const co = require('co');
const tohtml = require('./tohtml').t;


exports.recent=[];

exports.update=new EventEmitter();

exports.unkownThreads=[];

var config=au.read("./file/config.json","json");
exports.__defineGetter__("config",function(){return config.data;});

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public'
});

var spamt=au.read("file/spam.txt","txt");

knex.schema.hasTable('threads').then(function (exists) {
    if (!exists) {
        knex.raw("CREATE TABLE threads (\
tid INTEGER NOT NULL PRIMARY KEY,\
stamp INTEGER NOT NULL,\
records INTEGER NOT NULL DEFAULT 0,\
title TEXT NOT NULL UNIQUE,\
dat INTEGER NOT NULL UNIQUE,\
file TEXT NOT NULL UNIQUE,\
laststamp INTEGER,\
lastid CHAR(32)\
);").then(function () {
                knex.raw("CREATE unique index tindex on threads(title,file,dat);").then();
                knex.raw("CREATE index sindex on threads(stamp);").then();
            });

        knex.raw("CREATE TABLE spam (id CHAR(32) NOT NULL UNIQUE);").then(function () {
            knex.raw("CREATE unique index spamindex on spam(id);").then();
        });
        knex.raw("CREATE TABLE tag (id INTEGER NOT NULL PRIMARY KEY,tag TEXT NOT NULL UNIQUE);").then(function () {
            knex.raw("CREATE unique index tagindex on tag(tag);").then();
        });
        knex.raw("CREATE TABLE ttt (id INTEGER NOT NULL,tag INTEGER NOT NULL);").then(function () {
            knex.raw("CREATE index tiindex on ttt(id);").then();
            knex.raw("CREATE index taindex on ttt(tag);").then();
        });
        if (exports.config.image) fs.mkdir("./cache");
    }
});

exports.threads = {
	get:function(option){
		var s=knex.select().from("threads");
		if(option.time)s=s.whereRaw(times(option.time));
		if(option.sort)s=s.orderBy("stamp","desc");
		if(option.limit)s=s.limit(option.limit);
        /*if(option.tag){
            o="*,group_concat(tag) as tags";
            s+" join (select tag.tag,ttt.id from ttt join tag on ttt.tag = tag.id) on tid=id group by tid;";
        }*/
        s=s.catch(function(){return [];});
        if(option.addDate)return s.then(exports.addDate);
		return s;
	},
	create:function(title,callback){
      const t = now();
	  const file = threadFile(title);
      console.log("newThread:" + t + " " + t + " " + file + " " + title);
      const l=exports.unkownThreads;
      for(var i=0;i<l.length;i++){
          if(l[i].file==file){l.splice(i,1);}
      }
          try {
              co(function*(){
                  yield knex.raw("CREATE TABLE " + file + " (stamp INTEGER NOT NULL,id CHAR(32) NOT NULL,content TEXT NOT NULL);");
                  yield knex("threads").insert({stamp:t,title:title,dat:t,file:file});
                  yield knex.raw("CREATE index "+file+"_sindex on "+file+"(stamp);");
                  if(exports.config.image)fs.mkdir("./cache/" + file, callback);else callback();
              });
          } catch (e) { }
	},
	info:function(option){
        var s = knex.select("stamp","records","title","file","dat").from("threads");
		if(option.file)s=s.where("file",option.file);
		else if(option.title)s=s.where("title",option.title);
		else if(option.dat)s=s.where("dat",option.dat);
		return s.then(function(rows){
			if(rows.length==1)return Promise.resolve(rows[0]);
			return Promise.reject();
		});
	}
};
exports.thread = {
	get:function(file,option){
		var s = knex.select((option.head)?["stamp","id"]:undefined).from(file);
		if(option.time)s=s.whereRaw(times(option.time));
		if(option.id)s=s.andWhere("id",option.id);
		if(option.limit&&option.offset&&(option.offset>=0))s=s.whereBetween("rowid",[option.offset,(option.limit+option.offset-1)]);
		return s.orderBy("stamp","asc").catch(function(){return [];});
	},
	post:function(file,stamp,id,body){
		if(!body)throw new Error("Empty Message");
        var ss=spamt.data.split("[\n\r]+");
        if(!exports.config.image){ss.push("attach:");}
        for (var s of ss) {
            if (body.match(s)) {
                knex("spam").insert({id:id});
                console.log("spam:" + body);
                return;
            }
        }
		const md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
		if(id){if(md5!=id){console.log(id);throw new Error("Abnormal MD5");}}
		else{id=md5;}
        add(file,stamp,id,body);
	},
    convert:function(file,option) {
        return exports.thread.get(file,option).then(function(rows) {
            if(option.html){return rows.map(conv(file)).map(function(ele){
                ele.body=tohtml(ele.body);
                return ele;
            });}
            return rows.map(conv(file));
        });
    }
};

exports.spam=function(id){
    return knex.select("id").from("spam").where("id",id).then(function(rows){
        if(rows.length==0)return Promise.resolve();
        else return Promise.reject();
    },function(){return Promise.resolve();});
};

exports.post = function (file, name, mail, body, time, subject) {
    //if(subject)exports.threads.create(subject);
 var s = "";
 if(mail)s+="mail:"+escape(mail)+"<>";
 if(name)s+="name:"+escape(name)+"<>";
 s+="body:"+escape(body).replace(/\r\n|\r|\n/g,"<br>");
 exports.threads.info(file).then(function(row){
   exports.thread.post(row.file,time||now(),null,s);
 });  
};

const aday=60*60*24;
function add(file,stamp,id,content){
    knex.transaction(function(trx) {
        return trx.select("stamp","id").from(file).whereBetween("stamp",[stamp-aday,stamp+aday]).andWhere("id",id)
        .then(function(rows){
            if (rows.length > 0) {
                if(stamp!==rows[0].stamp)knex("spam").insert({id:id});
                return;
            }
            if (content.indexOf("attach:") != -1) {
                const suffix = content.match(/suffix:([^(<>)]*)/)[1];
                const attach = content.match(/attach:([^(<>)]*)/)[1];
                const data = new Buffer(attach, "base64");
                const md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                const name = md5 + "." + suffix;
                content = content.replace(/attach:[^(<>)]*/g, ("attach:" + name));
                console.log(name);
                fs.writeFile("./cache/" + file + "/" + name, data, function (err) { if (err) console.log(err); });
            }
            exports.update.emit('update', file, stamp, id, content);
            return Promise.all([
                trx("threads").where("file",file).update({stamp:now(),laststamp:stamp,lastid:id,records:knex.raw("records + 1")}),
                trx(file).insert({stamp:stamp,id:id,content:content})
            ]);
        });
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
    while(list.length>0&&list[0].stamp<t){
        list.shift();
    }
}

exports.addDate = function(rows){
	var time = "";
	for(var i=0;i<rows.length;i++){
		time = new Date(rows[i].stamp*1000).toString();
		rows[i].date = time.substring(0,time.lastIndexOf(" GMT"));
	}
	return rows;
};
function conv(file){
    return function(row) {
    	var time = new Date(row.stamp*1000).toString();
		time = time.substring(0,time.lastIndexOf(" GMT"));
		const r={date:time,id:row.id.substr(0,8)};
		const content=row.content.split("<>");		
		for(var j of content){
			var x = j.match(/^([a-z_]*):(.*)/);
			if(x)r[x[1]]=x[2];
		}
        r.body=r.body||"";
        if(r.attach)r.body+="<br>"+exports.host+"/file/"+file+"/"+r.attach;
        return r;
    };
}
exports.conv=conv;


exports.attach = function (file) {
    return function (rows) {
        if(!exports.config.image)return rows;
        return new Promise(function (resolve, reject) {
            co(function* () {
                try {
                    for (var i = 0; i < rows.length; i++) {
                        var s = rows[i].content;
                        if (s.indexOf("attach:") === -1) continue;
                        var j = s.match(/attach:([^(<>)]*)/);
                        var buf = yield co.wrap(fs.readFile)("./cache/" + file + "/" + j[1]);
                        rows[i].content = s.replace(/attach:([^(<>)]*)/, "attach:" + buf.toString("base64"));
                    }
                    resolve(rows);
                } catch (e) { reject(e); }
            });
        });
    };
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
	var s="stamp ";
	if(x.length==1)return s+"= "+x[0];
	if(x[1]=="")return s+">= "+x[0];
	if(x[0]=="")return s+"<= "+x[1];
	return s+"between "+x[0]+" and "+x[1];
}