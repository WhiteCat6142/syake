var zlib = require('zlib');
var cache = require('memory-cache');
var crypto = require('crypto');

function setHeaders(res,etag,option){
    res.setHeader("Etag",etag);
    if(option&&option.type)res.setHeader("Content-Type",option.type);
    res.setHeader("Cache-Control","public, max-age=86400, must-revalidate");
    res.setHeader("Vary","Accept-Encoding");
}

exports.get = function(req,res,next){
        var x = cache.get(req.url);
        if(!x){
            next();
            return;
        }
        setHeaders(res,x.etag,x.option);
        var etag =req.headers['if-none-match'];
        if(x.etag==etag){
            res.sendStatus(304);
            return;
        }
        var encoding =req.headers['accept-encoding']||"";
        if(encoding.indexOf("gzip")!=-1){
            res.setHeader("Content-Encoding","gzip");
            res.end(x.body);
        }else{
            zlib.gunzip(x.body, function (err, binary) {
                res.end(binary);
            });
        }
};
exports.put=function(req,res,next){
   var option = {type:"text/html"};
   var re = function(err,html){
       var etag=exports.add(req.url,html,option);
       setHeaders(res,etag,option);
       res.end(html);
   };
   res.renderX=function(view,local){return res.render(view,local,re);};
   res.endX=function(data){
       var option={type:res.getHeader('content-type')};
       var etag=exports.add(req.url,data,option);
       setHeaders(res,etag,option)
       return res.end(data);
   };
   next();
};
exports.add=function(url,data,option){
    var etag = "W/\""+crypto.createHash('md5').update(data, 'utf8').digest('hex')+"\"";
    zlib.gzip(new Buffer(data),function (err, binary) {
        cache.put(url,{body:binary,etag:etag,option:option},60*60*1000);//1h
    });
    return etag;
};
exports.clear=function(){
    cache.clear();
};