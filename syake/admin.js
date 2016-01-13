var api = require('./api2');
var nodeManeger = require('./cron');

function newThread(req,res){
    var file = req.params.file;
    nodeManeger.readAll(req.params.node.replace("+","/"),file);
    api.threads.info({file:file}).then(function(row){
        var title = encodeURIComponent(row.title);
        setTimeout(function(){
            res.redirect("/thread.cgi/"+title);
        },7);
    });
}

exports.set=function(app){
    app.get('/new/:node/:file',newThread);
app.get('/refresh',function(req,res){
    var a = nodeManeger.nodes;
    for(var i=0; i<a.length; i++){nodeManeger.read(a[i]);}
    res.redirect("back");
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