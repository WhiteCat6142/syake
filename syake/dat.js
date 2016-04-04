"use strict";

const api = require('./api2');
const iconv = require('iconv-lite');
const co = require('co');

function subject(req,res){
    api.threads.get({sort:true}).then(function(rows){
        for(var i=0;i<rows.length;i++){
            res.writeX(en((rows[i].dat+".dat<>"+rows[i].title+" ("+rows[i].records+")\n")));
        }
        res.endX();
    });
}
function dat(req,res){
    api.threads.info({dat:req.params.dat.slice(0,-4)}).then(function(row){
        const file = row.file;
        api.thread.get(file,{sort:true}).then(api.convert).then(function(rows){
        co(function*() {
        var idlist = [];
        for(var i=0;i<rows.length;i++){
            var body = rows[i].body;
            var b1 = body.match(/&gt;&gt;\w{8}/g);
            if(b1){
                for(var ele of b1){
                    const index = idlist.indexOf(ele.substr(8,8))+1;
                    body=body.replace(ele,"&gt;&gt;"+index);
                }
            }
            var b2 = body.match(/\[\[[^\]]*\]\]/g);
            if(b2){
                for(var ele of b2){
                    try{
                    const title = ele.slice(2,-2).split("/");
                    const dat=yield api.threads.info({title:title[0]});
                    if(dat)body=body.replace(ele,"<br>"+title+"<br>"+api.host(req)+"/test/read.cgi/2ch/"+dat.dat+((title[1])?"/"+title[1]:"")+"<br>");
                    }catch(e){}
                }
            }
            idlist.push(rows[i].id.substr(0,8));
            res.writeX(en(([
                rows[i].name,
                rows[i].mail,
                rows[i].date+" ID:"+rows[i].id,
                body,
                (i==0)?row.title:""
            ].join("<>")+"\n")));
        }
        res.endX();
        });
        });
    });
}
const msg = en("<HTML><!-- 2ch_X:true --><HEAD><TITLE>書きこみました</TITLE></HEAD><BODY>書きこみました</BODY></HTML>");
function post(req, res){
 const b =req.body;
 api.post({dat:b.key},de(b.FROM),de(b.mail),de(b.MESSAGE),parseInt(b.time,10))
 res.end(msg);
}

function read(req,res){
    api.threads.info({dat:req.params.dat}).then(function(row){
        const title = encodeURIComponent(row.title);
        const id = req.params.id|0;
        if(!id)res.redirect("/thread.cgi/"+title);
        else{
            api.thread.get(row.file,{sort:true}).then(function(rows){
                res.redirect("/thread.cgi/"+title+"/"+rows[id-1].id);
            });
        }
    });
}

function de(str){
 var output = "";
 for(var i=0; i<str.length; ++i){
  if(str.charAt(i)!="%")output+=str.charCodeAt(i).toString(16);
  else output+=str.charAt(++i)+str.charAt(++i);
 }
    return iconv.decode(new Buffer(output,"hex"),"Shift_JIS");
}
function en(str){
    return iconv.encode(str,"Shift_JIS");
}

exports.set=function(app){
    app.use(function(req,res,next){
        res.contentType("text/plain; charset=Shift_JIS");
        next();
    });
app.get('/2ch/subject.txt',subject);
app.get('/2ch/dat/:dat',dat);
app.post('/test/bbs.cgi',post);
app.get('/test/read.cgi/2ch/:dat',read);
app.get('/test/read.cgi/2ch/:dat/:id',read);
};