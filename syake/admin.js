var api = require('./api2');
var nodeManeger = require('./cron');
var cache =require('memory-cache');

exports.set=function(app){
app.use(function(req, res, next){
    var user = req.headers["authorization"];
  if(!user){
      res.setHeader("WWW-Authenticate","Basic realm=\"ADMIN ACTION\"");
      res.sendStatus(401);
  }else{
      user=new Buffer(user.substr("Basic ".length), 'base64').toString();
      if(api.config.user==user){next();}
      else{res.sendStatus(403);}
  }
});
    
app.get('/',function(req,res){
    res.render('admin',{nodes:nodeManeger.nodes});
});
app.post('/node',function(req,res){
    var node = req.body.node;
    if(node.startsWith("del ")){}
     else {nodeManeger.nodes.push(node);}
    res.redirect("back");
});
app.get('/refresh',function(req,res){
    var a = nodeManeger.nodes;
    for(var i=0; i<a.length; i++){nodeManeger.read(a[i]);}
    cache.clear();
    res.redirect("back");
});

app.get('/new/:node/:file',function(req,res){
    var file = req.params.file;
    nodeManeger.readAll(req.params.node.replace("+","/"),file);
    api.threads.info({file:file}).then(function(row){
        var title = encodeURIComponent(row.title);
        setTimeout(function(){
            res.redirect("/thread.cgi/"+title);
        },10);
    });
});
app.get('/new/:title',function(req,res){
    api.threads.create(req.params.title);
    res.redirect("/thread.cgi/"+req.params.title);
});
app.get('/post',function(req,res){
    res.end("<html><body><form action='/admin.cgi/post' method='post'><input name=\"x\" type=\"text\" /><button type=\"submit\" >Post</button></form></body></html>");
});
app.post('/post',function(req,res){
    api.thread.post("thread_63",Math.round(new Date().getTime()/1000),null,req.body.x);
    res.end();
});
};