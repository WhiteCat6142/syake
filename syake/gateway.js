var api = require('./api');

var escape = require('escape-html');

var tags =["a","b","c"];
exports.index = function(req, res) {
 api.threads("limit 15",function(threads) {
  res.render('index',{threads:threads,tags:tags});
 });
};
exports.changes= function(req, res) {console.log(req.query.tag);
 api.threads("",function(threads) {
  res.render('index',{threads:threads,tags:tags});
 });
};


exports.thread = function(req, res){
 var title = req.params.id;
 var file = api.threadfile(title);
 api.get(file,"limit 30",function(err,rows) {
  if(!err)res.render('bbs', { title: title, messages: rows,file: file});
 });
};

exports.post = function(req, res){
 var b =req.body;
 if(b.cmd!="post")return;
 var body = [];
 if(b.mail)body.push("mail:"+b.mail);
 if(b.name)body.push("name:"+b.name);
 if(b.body)body.push("body:"+escape(b.body).replace(/\n/g,"<br>"));
 api.post(b.file,null,null,body.join("<>"));
 res.redirect('back');
};