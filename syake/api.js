var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('record.sqlite3');

var crypto = require('crypto');

exports.threads = function(option,callback){
 var rows="*";
 db.all("SELECT "+rows+" FROM threads order by stamp desc "+ option, function(err, rows){
  if(err)throw err;
  callback(rows);
 });
};

function encode(s){
 var output = "";
 var x = 0;
 for(i=0; i<s.length; ++i){
  x = s.charCodeAt(i);
  output += (x<0x80)?x.toString(16).toUpperCase():s.charAt(i);
 }
 return encodeURIComponent(output).replace(/%/g,"");
}
exports.threadfile = function(title){return "thread_"+encode(title);};
function decode(s){
 var output = "";
 for(i=0; i<s.length; ++i){output+=((i%2==0)?"%":"")+s.charAt(i);}
 console.log(output);
 return decodeURIComponent(output);
}
exports.getTitle = function(file){return decode(file.substring("thread_".length));};

exports.create = function(file){
 db.run("CREATE TABLE IF NOT EXISTS "+file+" (stamp int,id text,content text)");
 db.run("INSERT INTO threads(title,file) VALUES(?,?)", exports.getTitle(file), file ,function(err,row){if(!err)console.log(err);});
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
 var time = new Date().toString();
 time = time.substring(0,time.indexOf(" GMT"));

 db.get("SELECT * from threads where file = ?",file, function(err,row){
  db.serialize(function(){
   if(!row)exports.create(file);
   db.run("UPDATE threads set stamp=?, date=?, records=records + 1 where file = ?", now, time, file);
   db.run("INSERT INTO "+file+"  VALUES(?,?,?)", stamp, id, body);
  });
 });
};