var api = require('./api2');
var cache = require('memory-cache');

var tags =["a","b","c"];
function index(req, res) {
 api.threads.get({limit:15,sort:true}).then(api.addDate).then(function(threads) {
  res.render('index',{threads:threads,tags:tags,x:api.unkownThreads});
 });
}
function changes(req, res) {
 api.threads.get({sort:true,tag:req.query.tag}).then(api.addDate).then(function(threads) {
  res.render('index',{threads:threads,tags:tags});
 });
}

function thread(req, res){
 var title = req.params.id;
 api.threads.info({title:title}).then(function(row){
   var file = row.file;
   api.thread.get(file,{}).then(api.convert)
   .then(function(rows){res.render('bbs', { title: title, messages: rows,file: file});
   });
 }).catch(function(){res.sendStatus(404);});
}

function post(req, res){
var b =req.body;
 if(b.cmd!="post")return;
api.post({file:b.file},b.name,b.mail,b.body,undefined);
res.redirect('back');
}

exports.set=function(app){
app.get('/',index);
app.get('/gateway.cgi',index);
app.get('/gateway.cgi/changes',changes);
app.get('/thread.cgi/:id',thread);
app.post('/thread.cgi',post);
};