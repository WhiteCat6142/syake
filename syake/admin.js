var api = require('./api2');
var nodeManeger = require('./cron');

function newThread(req,res){
    var file = req.params.file;
    nodeManeger.readAll(req.params.node.replace("+","/"),file);
    api.threads.info({file:file}).then(function(row){
        var title = encodeURIComponent(row.title);
        setTimeout(function(){
            res.redirect("/thread.cgi/"+title);
        },5);
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
};