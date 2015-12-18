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

exports.threads = {
	get:function(option){
		var s="";
		if(option.time)s+=times(option.time);
		if(option.sort)s+=" order by stamp desc";
		if(option.limit)s+=" limit "+option.limit;
		return sqlGet("threads",s);
	},
	create:function(title){
	  var dat = now()+".dat";
	  var file = threadFile(title);
 	  sqlRun("CREATE TABLE IF NOT EXISTS ?? (stamp int,id text,content text)", file);
 	  sqlRun("INSERT INTO threads(file,title,dat) VALUES(?,?,?)", file, title, dat);
	},
	info:function(option){
		var s="";
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
		if(option.limit)s+=" limit "+option.limit;
		if(option.offset)s+=" offset "+option.offset;
		return sqlGet(file,s);
	},
	post:function(file,stamp,id,body){
		console.log(file,stamp,id,body);
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
   rows[i].date = time.substring(0,time.indexOf(" GMT"));
  }
  return Promise.resolve(rows);
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

function now(){return Math.round(new Date().getTime()/1000);}

function times(time){
	var x = time.split("-");
	var s=" where stamp ";
	if(x.length==1)return s+"= "+x[0];
	if(x[1]=="")return s+">= "+x[0];
	if(x[0]=="")return s+"<= "+x[1];
	return s+"between "+x[0]+" and "+x[1];
}