var api = require('./api2');
var iconv = require('iconv-lite');

function subject(req,res){
    api.threads.get({}).then(function(rows){
        for(var i=0;i<rows.length;i++){
            res.write(iconv.encode((rows[i].dat+"<>"+rows[i].title+" ("+rows[i].records+")\n"),"Shift_JIS"));
        }
        res.end();
    });
}
function dat(req,res){
    api.threads.info({dat:req.params.dat}).then(function(row){
        var file = row.file;
        api.thread.get(file,{sort:true}).then(api.convert).then(function(rows){
        for(var i=0;i<rows.length;i++){
            res.write(iconv.encode(([
                rows[i].name,
                rows[i].mail,
                rows[i].date+" ID:"+rows[i].id,
                rows[i].body,
                (i==0)?row.title:""
            ].join("<>")+"\n"),"Shift_JIS"));
        }
        res.end();
        });
    });
}
var msg = iconv.encode("<HTML><!-- 2ch_X:true --><HEAD><TITLE>書きこみました</TITLE></HEAD><BODY>書きこみました</BODY></HTML>","Shift_JIS");
function post(req, res){
 var b =req.body;
 api.post({dat:b.key+".dat"},b.FROM,b.mail,b.MESSAGE,parseInt(b.time,10))
 res.end(msg);
}

exports.set=function(app){
    app.use(function(req,res,next){
        res.setHeader("Content-Type","text/plain; charset=Shift_JIS");
        next();
    });
app.get('/2ch/subject.txt',subject);
app.get('/2ch/dat/:dat',dat);
app.post('/test/bbs.cgi',post);
};