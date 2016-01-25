var api = require('./api2');
var cache = require("../comp-cache");
var RSS = require('rss');

api.update.on("update",function(file,stamp,id){
    cache.clear();
})
Object.observe(api.unkownThreads, function(changes){
    cache.clear();
});

var tags =["a","b","c"];
function index(req, res) {
 api.threads.get({limit:15,sort:true}).then(api.addDate).then(function(threads) {
  res.render('index',{threads:threads,tags:tags,x:api.unkownThreads},cache.put(req,res));
 });
}
function changes(req, res) {
 api.threads.get({sort:true,tag:req.query.tag}).then(api.addDate).then(function(threads) {
  res.render('index',{threads:threads,tags:tags,x:api.unkownThreads},cache.put(req,res));
 });
}

function thread(req, res){
 var title = req.params.id;
 api.threads.info({title:title}).then(function(row){
   var file = row.file;
   api.thread.get(file,{}).then(api.convert)
   .then(function(rows){res.render('bbs', { title: title, messages: rows,file: file},cache.put(req,res));
   });
 }).catch(function(){res.sendStatus(404);});
}

function post(req, res){
var b =req.body;
 if(b.cmd!="post")return;
api.post({file:b.file},b.name,b.mail,b.body,undefined);
res.redirect('back');
}

function rss(req,res){
    res.setHeader("Content-Type","text/xml; charset=UTF-8");
    var rss = new RSS(api.config.feed);
    var recent =  JSON.parse(JSON.stringify(api.recent)).reverse();
    var bodys=api.convert(recent);
    for(var i=0;i<recent.length;i++){
        var x = recent[i];
        rss.item({
            url: "/thread.cgi/" + encodeURIComponent(x.title) + "/" + x.id,
            title:x.title,
            description:bodys[i].body,
            date:bodys[i].date,
            author:bodys[i].name||bodys[i].mail
        });
    }
    cache.add(req.url,rss.xml());
    res.end(rss.xml());
}

exports.set=function(app){
app.get('/',index);
app.get('/gateway.cgi',index);
app.get('/gateway.cgi/changes',changes);
app.get('/gateway.cgi/rss',rss);
app.get('/thread.cgi/:id',thread);
app.get('/thread.cgi/:id/:i',thread);
app.post('/thread.cgi',post);
};