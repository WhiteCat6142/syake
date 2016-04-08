"use strict";

const api = require('./api2');
const nodeManeger = require('./cron');
const cache =require('comp-cache');

exports.set=function(app){
app.use(function(req, res, next){
  var user = req.headers["authorization"];
  if(user){
      user=new Buffer(user.substr("Basic ".length), 'base64').toString();
      if(api.config.user==user){next();return;}
  }
  res.setHeader("WWW-Authenticate","Basic realm=\"ADMIN ACTION\"");
  res.sendStatus(401);
});
    
app.get('/',function(req,res){
    res.render('admin',{nodes:nodeManeger.nodes.map(function(ele){return ele.replace(/\//g,"+")}),x:api.unkownThreads});
});
app.post('/node',function(req,res){
    const node = req.body.node;
    nodeManeger.nodes.push(node);
    res.redirect("back");
});
app.get('/node/del/:node',function(req,res){
    const node =req.params.node.replace(/\+/g,"/");
    const i =nodeManeger.nodes.indexOf(node);
    if(i>0)nodeManeger.nodes.splice(i,1);
    res.redirect("back");
});
app.get('/refresh',function(req,res){
    const a = nodeManeger.nodes;
    for(var i=0; i<a.length; i++){nodeManeger.read(a[i]);}
    cache.clear();
    res.redirect("back");
});
app.get('/refreshc',function(req,res){
    cache.clear();
    res.redirect("back");
});

app.get('/new/:node/:file',function(req,res){
    const file = req.params.file;
    nodeManeger.readAll(req.params.node.replace("+","/"),file);
    setTimeout(function(){
    api.threads.info({file:file}).then(function(row){
        const title = encodeURIComponent(row.title);
            res.redirect("/thread.cgi/"+title);
    });
    },7500);
});

app.get('/post',function(req,res){
    res.end("<html><body><form action='/admin.cgi/post' method='post'><input name=\"x\" type=\"text\" /><button type=\"submit\" >Post</button></form></body></html>");
});
app.post('/post',function(req,res){
    api.thread.post("thread_63",Math.round(new Date().getTime()/1000),null,req.body.x);
    res.end();
});
};