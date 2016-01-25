var zlib = require('zlib');
var cache = require('memory-cache');
var crypto = require('crypto');

exports.get = function(req,res,next){
        var x = cache.get(req.url);
        if(!x){
            next();
            return;
        }
        res.setHeader("Etag",x.etag);
        res.setHeader("Cache-Control","public, max-age=86400, must-revalidate");
        var etag =req.headers['if-none-match'];
        if(x.etag==etag){
            res.sendStatus(304);
            return;
        }
        var encoding =req.headers['accept-encoding']||"";
        if(encoding.indexOf("gzip")!=-1){
            res.setHeader("Content-Encoding","gzip");
            res.setHeader("Vary","Accept-Encoding");
            res.end(x.body);
        }else{
            zlib.gunzip(x.body, function (err, binary) {
                res.end(binary);
            });
        }
};
exports.put=function(req,res){
   return function(err,html){
       var etag=exports.add(req.url,html);
       res.setHeader("Etag",etag);
       res.setHeader("Cache-Control","public, max-age=86400, must-revalidate");
       res.end(html);
   };
};
exports.add=function(url,data){
    var etag = "W/\""+crypto.createHash('md5').update(data, 'utf8').digest('hex')+"\"";
    zlib.gzip(new Buffer(data),function (err, binary) {
        cache.put(url,{body:binary,etag:etag},60*60*1000);//1h
    });
    return etag;
};
exports.clear=function(){
    cache.clear();
};