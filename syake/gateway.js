var api = require('./api2');
var cache = require('memory-cache');
var escape = require('escape-html');

var tags =["a","b","c"];
function index(req, res) {
 api.threads.get({limit:15,sort:true}).then(api.addDate).then(function(threads) {
  res.render('index',{threads:threads,tags:tags});
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
   api.thread.get(file,{}).then(api.addDate)
   .then(function(rows){res.render('bbs', { title: title, messages: rows,file: file});
   });
 }).catch(function(){res.sendStatus(404);});
}

function post(req, res){
 var b =req.body;
 if(b.cmd!="post")return;
 if(b.key)res.end();else res.redirect('back');
// if(b.subject)api.threads.create(b.subject);
 var now = Math.round(new Date().getTime()/1000);
 var body = "";
 if(b.mail)body+="mail:"+b.mail+"<>";
 if(b.name)body+="name:"+b.name+"<>";
 body+="body:"+escape(b.body).replace(/\r\n|\r|\n/g,"<br>");
 api.threads.info({file:b.file,dat:(b.key)?b.key+".dat":undefined}).then(function(row){
   api.thread.post(row.file,now,null,body);
 });
}

exports.set=function(app){
app.get('/',index);
app.get('/gateway.cgi',index);
app.get('/gateway.cgi/changes',changes);
app.get('/thread.cgi/:id',thread);
app.post('/thread.cgi',post);
app.post('/test/bbs.cgi',post);
};