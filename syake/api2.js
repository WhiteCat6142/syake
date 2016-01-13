var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('record.sqlite3');
var crypto = require('crypto');

function sqlGet(file,option,o){
	return new Promise(function(resolve, reject){
		db.all("SELECT * FROM "+file+option,o,function(err,rows){
			if(!err){resolve(rows);}else{reject(err);}
		});
	});
}
var sqlRun = db.run;

var recent ={last:""};
exports.recent=recent;

exports.unkownThreads=[];

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
		recent.last=file+"/"+stamp+"/"+id;
		db.run("UPDATE threads set stamp=?, records=records+1, laststamp=?, lastid=? where file = ?", now(), stamp, id, file);
		db.run("INSERT INTO "+file+" VALUES(?,?,?)", stamp, id, body);
	}
};

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
	return Promise.resolve(r);
};

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