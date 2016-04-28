const image=["png","bmp","gif","jpg","jpeg","bin","tif","tiff"]


exports.t=function(body) {
        var b3 = body.match(/h?ttps?:\/\/[0-9-_a-zA-Z.\/%!#$&+,:;=@\[\]\?]+/g);
        if (b3) {
          b3.forEach(function (ele) {
            var link = (ele[0] == 'h') ? ele : 'h' + ele;
            var i=link.lastIndexOf(".");
            if ((i>0)&&(image.indexOf(link.substr(i+1))!=-1)) body = body.replace(ele, '<a href="' + link + '" data-lightbox="image">' + '<img class="lazy" data-src="' + link + '"></a>');
             else body = body.replace(ele, '<a href="' + link + '">' + ele + '</a>');
          });
        }
    return body;
};