var api = require('./api2');
var iconv = require('iconv-lite');

function subject(req,res){
    api.threads.get({sort:true}).then(function(rows){
        for(var i=0;i<rows.length;i++){
            res.write(en((rows[i].dat+"<>"+rows[i].title+" ("+rows[i].records+")\n")));
        }
        res.end();
    });
}
function dat(req,res){
    api.threads.info({dat:req.params.dat}).then(function(row){
        res.setHeader("Last-Modified",new Date(row.stamp).toString());
        var t = req.headers["if-modified-since"];
        if(t){
            if(row.stamp<=Math.round(new Date(t).getTime()/1000)){
            res.sendStatus(304);
            return;
            }
        }
        var file = row.file;
        api.thread.get(file,{sort:true}).then(api.convert).then(function(rows){
        for(var i=0;i<rows.length;i++){
            res.write(en(([
                rows[i].name,
                rows[i].mail,
                rows[i].date+" ID:"+rows[i].id,
                rows[i].body,
                (i==0)?row.title:""
            ].join("<>")+"\n")));
        }
        res.end();
        });
    });
}
var msg = en("<HTML><!-- 2ch_X:true --><HEAD><TITLE>書きこみました</TITLE></HEAD><BODY>書きこみました</BODY></HTML>");
function post(req, res){
 var b =req.body;
 api.post({dat:b.key+".dat"},de(b.FROM),de(b.mail),de(b.MESSAGE),parseInt(b.time,10))
 res.end(msg);
}

function de(str){
 var output = "";
 var x = 0;
 for(var i=0; i<str.length; ++i){
  if(str.charAt(i)!="%")output+=str.charCodeAt(i);
  else output+=str.charAt(++i)+str.charAt(++i);
 }
    return iconv.decode(new Buffer(output,"hex"),"Shift_JIS");
}
function en(str){
    return iconv.encode(str,"Shift_JIS");
}

exports.set=function(app){
    app.use(function(req,res,next){
        res.contentType("text/plain; charset=Shift_JIS");
        next();
    });
app.get('/2ch/subject.txt',subject);
app.get('/2ch/dat/:dat',dat);
app.post('/test/bbs.cgi',post);
};