var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('record.sqlite3');
var fs = require('fs');
var crypto = require('crypto');

db.each("select * from threads",function(err,r){
        if(err){
console.log("err:"+err.code);
return;
        }
        var file = r.file;
        db.all("select *,rowid from "+file,function(err,rows){
        if(err){
console.log(err+err.code);
return;
        }
var stmt = db.prepare("update "+file+" set content = ? where rowid = ?");
for(var i=0;i<rows.length;i++){
var x = rows[i];
                     if(x.content.indexOf("attach:")==-1){continue;}
                            var suffix = x.content.match(/suffix:([^(<>)]*)/)[1];
                            var attach = x.content.match(/attach:([^(<>)]*)/)[1];
                            var data = new Buffer(attach,"base64");
                            var md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                            var name = md5+"."+suffix;
                            var content = x.content.replace(/attach:[^(<>)]*/g,("attach:"+name));
                            console.log(name);
                            fs.writeFile("./cache/"+name,data,function(err){if(err)console.log(err);});
                            stmt.run(content,x.rowid);
}
stmt.finalize();
console.log(file);
        });
});

/*
exports.threads.get({}).then(function(rows){

        transaction(function(resolve, reject) {
            sqlGet(file,"").then(function(rows2){
                console.log(file);
                Promise.all(rows2.map(function(x){
                        return new Promise(function(resolve, reject) {
                            if(x.content.indexOf("attach:")==-1){resolve();return;}
                            var suffix = x.content.match(/suffix:([^(<>)]*)/)[1];
                            var attach = x.content.match(/attach:([^(<>)]*)/)[1];
                            var data = new Buffer(attach,"base64");
                            var md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                            var content = x.content.replace(/attach:[^(<>)]/,"attach:"+md5);
                            console.log(md5);
                            fs.writeFile("../cache/"+md5+"."+suffix,data,function(err){console.log(err);});
                            db.run("update "+file+"set content = '"+content+"' where id = '"+x.id+"'",resolve);
                        });
                })).then(resolve);
            }).catch(function(err){reject(err);});
        });
    }
}).catch(function(err){console.log(err);});

*/