"use strict";

const api = require('./api2');
const RSS = require('rss');

var tags =["a","b","c"];
function index(req, res) {
 api.threads.get({limit:10,sort:true,addDate:true}).then(function(threads) {
  res.renderX('index',{threads:threads,tags:tags,title:"新月 syake"});
 });
}
function changes(req, res) {
 api.threads.get({sort:true,tag:req.query.tag}).then(function(threads) {
     res.type("text/plain; charset=utf-8");
     res.endX(JSON.stringify(threads.map(function(t) {
         return {s:t.stamp,t:t.title,r:t.records};
     })));
 });
}

function thread(req, res){
 const title = req.params.id;
 api.threads.info({title:title}).then(function(row){
   const file = row.file;
   res.setHeader('Last-Modified',row.stamp);
   const offset = Math.max(row.records-10,0);//limit:10,offset:offset
   api.thread.get(file,{}).then(api.convert)
   .then(function(rows){res.renderX('bbs', { title: title, messages: rows,file: file});
   });
 }).catch(function(){res.sendStatus(404);});
}

function post(req, res){
const b =req.body;
 if(b.cmd!="post")return;
api.post({file:b.file},b.name,b.mail,b.body,undefined);
res.redirect('back');
}

function rss(req,res){
    res.setHeader("Content-Type","text/xml; charset=UTF-8");
    const rss = new RSS(api.config.feed);
    const recent = JSON.parse(JSON.stringify(api.recent)).reverse();
    const bodys=api.convert(recent);
    for(var i=0;i<recent.length;i++){
        var x = recent[i];
        rss.item({
            url:(api.host(req)+"/thread.cgi/"+encodeURIComponent(x.title)+"/"+x.id),
            title:x.title,
            description:bodys[i].body,
            date:bodys[i].date,
            author:bodys[i].name||bodys[i].mail
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