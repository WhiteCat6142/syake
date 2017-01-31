"use strict";

const api = require('./api2');
const iconv = require('iconv-lite');
const co = require('co');
const fs = require('fs');

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
        res.setHeader('Last-Modified',new Date(row.stamp).toUTCString());
        api.thread.convert(file,{sort:true}).then(function(rows){
        if(rows.length===0){res.sendStatus(404);return;}
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
                    if(dat)body=body.replace(ele,"<br>"+title+"<br>"+api.host+"/test/read.cgi/2ch/"+dat.dat+"<br>");
                    }catch(e){}
                }
            }
            idlist.push(rows[i].id.substr(0,8));
            res.writeX(en(([
                rows[i].name,
                rows[i].mail,
                rows[i].date+" ID:???",
                body,
                (i==0)?row.title:""
            ].join("<>")+"\n")));
        }
        res.endX();
        });
        });
    }).catch(function(){
        res.sendStatus(404);
    });
}
const msg = en("<HTML><!-- 2ch_X:true --><HEAD><TITLE>書きこみました</TITLE></HEAD><BODY>書きこみました</BODY></HTML>");
const emsg = en("<HTML><!-- 2ch_X:error --><HEAD><TITLE>ＥＲＲＯＲ</TITLE></HEAD><BODY>書きこめませんでした</BODY></HTML>");
function post(req, res){
 const b =req.body;
 var body=de(b.MESSAGE);
 var b1 = body.match(/>>[\d-,]+/g);
 if (b1) {
     api.threads.info({dat:b.key})
         .then(function (row) {
             return api.thread.get(row.file, { sort: true, head: true });
         })
         .then(function (rows) {
             for (var ele of b1) {
                 if (ele.indexOf(",") || ele.indexOf("-")) {
                     var e=trans(ele).map(function(i){if(i)return ">>" + rows[i - 1].id.substr(0, 8);return ">>0"}).join(" ");
                     body = body.replace(ele, e);
                 } else {
                     var i = ele.substr(2) | 0;
                     if (i == 0) continue;
                     body = body.replace(ele, ">>" + rows[i - 1].id.substr(0, 8));
                 }
             }
             return body;
            })
            .then(function(body) {
                api.post({dat:b.key},de(b.FROM),de(b.mail),body,parseInt(b.time,10));
                res.end(msg);
            }).catch(function(){
                res.end(emsg);
            });
 } else {
      api.post({dat:b.key},de(b.FROM),de(b.mail),body,parseInt(b.time,10));
      res.end(msg);
 }
}
function trans(s) {
    s=s.substr(2);
    var r=[];
    var b1=s.split(',');
    for(var e of b1){
        var b2=e.split('-');
        if(b2[1]){
            var x=b2[0]|0,y=b2[1]|0;
            if(x>y){
                var tmp=x;
                x=y;
                y=tmp;
            }
            for(var i=x;i<=y;i++)r.push(i);
        }else{
            r.push(e|0);
        }
    }
    return r;
}

function read(req,res){
    api.threads.info({dat:req.params.dat}).then(function(row){
        const title = encodeURIComponent(row.title);
        const id = req.params.id|0;
        if(!id)res.redirect("/thread.cgi/"+title);
        else{
            api.thread.get(row.file,{sort:true,offset:id+1,limit:1,head:true}).then(function(rows){
                res.redirect("/thread.cgi/"+title+"#"+rows[id-1].id);
            });
        }
    });
}

function head(req,res) {
    fs.readFile("www/motd.txt","utf-8",function(err,data){
        res.endX(en(data.replace(/[\n\r]+/g,"<br>")));
    });
}
const settingT= en("BBS_TITLE=新月\n\
BBS_NONAME_NAME=新月名無しさん");
function setting(req,res) {
    res.endX(settingT);
}

function de(str){
 var output = "";
 var o=undefined;
 for(var i=0; i<str.length; ++i){
  if(str.charAt(i)!="%"){
      o=str.charCodeAt(i).toString(16);
      if(o.length%2==1)o="0"+o;
      output+=o;
    }
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
app.get('/2ch/head.txt',head);
app.get('/2ch/SETTING.TXT',setting);
};