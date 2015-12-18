var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('record.sqlite3');

var crypto = require('crypto');

var lastmodified =0;

exports.addDate = function(rows){
  var time = "";
  for(var i=0;i<rows.length;i++){
   time = new Date(rows[i].stamp*1000).toString();
   rows[i].date = time.substring(0,time.indexOf(" GMT"));
  }
  return rows;
}

exports.threads = function(option,callback){
 db.all("SELECT * FROM threads order by stamp desc "+ option, function(err, rows){callback(exports.addDate(rows));});
};

exports.notExist = function(file,callback,other){
  db.get("SELECT rowid from threads where file = ?",file, function(err,row){if(!row)callback();else if(other)other();});
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
exports.threadfile = function(title){return "thread_"+encode(title);};
function decode(s){
 var output = "";
 for(var i=0; i<s.length; ++i){output+=((i%2==0)?"%":"")+s.charAt(i);}
 return decodeURIComponent(output);
}
exports.getTitle = function(file){return decode(file.substring("thread_".length));};

exports.create = function(file){
 exports.notExist(file,function(){
  var now = Math.round(new Date().getTime()/1000);
  db.run("CREATE TABLE IF NOT EXISTS ?? (stamp int,id text,content text)", file);
  db.run("INSERT INTO threads(file,title,dat) VALUES(?,?,?)", file, exports.getTitle(file), now+".dat");
 });
};

exports.get = function(file,option,callback){
 if(option)option = " "+option;
 db.all("SELECT * FROM "+file+ option , callback);
};

function md5hex(src) {
    var md5 = crypto.createHash('md5');
    md5.update(src, 'utf8');
    return md5.digest('hex');
}
exports.post = function(file,stamp,id0,body){
 if(!body)throw new Error("Empty Message");
 var id = md5hex(body);
 if(id0&&id!=id0)throw new Error("Abnormal MD5");

 var now = Math.round(new Date().getTime()/1000);
 stamp = stamp||now;
 lastmodified=now;
 
 db.run("UPDATE threads set stamp=?, records=records+1 where file = ?", now, file);
 db.run("INSERT INTO "+file+" VALUES(?,?,?)", stamp, id, body);
};

exports.lastmodified = function(){return lastmodified;};