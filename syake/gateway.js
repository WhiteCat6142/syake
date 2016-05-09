"use strict";

const api = require('./api2');
const RSS = require('rss');
const tohtml = require('./tohtml').t;

function index(req, res) {
 Promise.all([
        api.threads.get({limit:10,sort:true,addDate:true}),
        api.tag()
 ])
 .then(function(x) {
  res.renderX('index',{threads:x[0],tags:x[1],title:"新月 syake"});
 });
}
function changes(req, res) {
 api.threads.get({sort:true,tag:req.query.tag.split(" ")}).then(function(threads) {
     res.type("text/plain; charset=utf-8");
     res.endX(JSON.stringify(threads.map(function(t) {
         return {s:t.stamp,t:t.title,r:t.records};
     })));
 });
}

function thread(req, res) {
    const title = req.params.id;
    api.threads.info({ title: title }).then(function (row) {
        const file = row.file;
        res.setHeader('Last-Modified', new Date(row.stamp).toUTCString());
        const offset = Math.max(row.records - 75, 0);//limit:10,offset:offset
        api.thread.convert(file, {offset:offset,limit:75}).then(function (rows) {
                rows.forEach(function(t) {t.body=tohtml(t.body);});
                res.renderX('bbs', { title: title, messages: rows, file: file });
            });
    }).catch(function () { res.sendStatus(404); });
}

function post(req, res){
const b =req.body;
 if(b.cmd!="post")return;
api.post({file:b.file},b.name,b.mail,b.body,undefined);
res.redirect('back');
}


var recent=[];
api.update.on("update",function(file,stamp,id,content){
    recent.unshift({
        title:api.getTitle(file),
        file:file,
        stamp:stamp,
        id:id,
        content:content
    });
    const t = Math.round(Date.now()/1000)-24*60*60;
    var i=recent.length;
    while(--i>=0&&recent[i].stamp<t){
        recent.pop();
    }
});

function rss(req,res){
    res.setHeader("Content-Type","text/xml; charset=UTF-8");
    const rss = new RSS(api.config.feed);
    for(var i=0;i<recent.length;i++){
        var body=api.conv(recent[i].file)(recent[i]);
        body.body=tohtml(body.body);
        var x = recent[i];
        rss.item({
            url:(api.host+"/thread.cgi/"+encodeURIComponent(x.title)+"/"+x.id),
            title:x.title,
            description:body.body,
            date:body.date,
            author:body.name||body.mail
        });
    }
    res.endX(rss.xml());
}
function newT(req,res){
    if(b.cmd!="post")return;
    api.threads.create(req.body.title);
    res.redirect("/thread.cgi/"+req.params.title);
}

exports.set=function(app){
app.get('/',index);
app.get('/gateway.cgi',index);
app.get('/gateway.cgi/api/changes',changes);
app.get('/gateway.cgi/rss',rss);
app.post('/gateway.cgi/new',newT);
app.get('/thread.cgi/:id',thread);
app.get('/thread.cgi/:id/:i',thread);
app.post('/thread.cgi',post);
};