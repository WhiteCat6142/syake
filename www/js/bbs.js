window.onload = function () { document.getElementById("cmd").value = "post"; };
  var th = 300;
  var unveil = function () {
    var n = document.getElementsByClassName('lazy');
    var len = n.length;
    if (len == 0) {
      return;
    }
    var wh = screen.height + th;
    for (var i = 0; i < len; i++) {
      var bound = n[i].getBoundingClientRect();
      if (bound.top > wh || bound.bottom < 0 - th) continue;
      var ele = n[i];
      ele.setAttribute('src', ele.getAttribute('data-src'));
      ele.removeAttribute('data-src');
      ele.removeAttribute('class');
      i--;
      len--;
    }
  }
  var timer = null;
  var listen = function () {
    clearTimeout(timer);
    timer = setTimeout(unveil, 200);
  }
  window.addEventListener('resize', listen);
  window.addEventListener('scroll', listen);
  listen();

$('#post-form').submit(function(event){
  var form=$(this);
  if(this.sign.value!==""){
    form.find("button").hide();
    event.preventDefault();
    var s=this.sign.value;
    this.sign.value="";
    $(this.sign).hide();

    var t=target(this);
    var k=genkey(s);
    var si=sign(t.r,k);
    form.append('<input value="'+toB(k.pub)+'" name="pubkey" type="hidden">');
    this.sign.value=si;
    form.append('<input value="'+t.t+'" name="target" type="hidden">');

    this.submit();
    location.reload();
  }
});

marked.setOptions({
    highlight: function(code,lang) {
        return hljs.highlightAuto(code,[lang]).value;
    }
});
var tmpl = Hogan.compile($('#tmpl').text());

var image=["png","bmp","gif","jpg","jpeg","bin","tif","tiff"];
function tohtml(body) {
    var b2 = body.match(/&gt;&gt;\w{8}/g);
    if (b2) {
        for (var j = 0; j < b2.length; j++) {
            var ele = b2[j];
            body = body.replace(ele, '<a class="popup">' + ele + "</a>");
        }
    }
    var b3 = body.match(/h?ttps?:\/\/[0-9-_a-zA-Z.\/%!#$&+,:;=@\[\]\?]+/g);
    if (b3) {
        for (var j = 0; j < b3.length; j++) {
            var ele = b3[j];
            var i = ele.lastIndexOf(".");
            if ((i > 0) && (image.indexOf(ele.substr(i + 1)) != -1)) {
                body = body.replace(ele, '<a href="' + ele + '" data-lightbox="image">' + '<img class="lazy" data-src=' + ele + '></a>');
            } else body = body.replace(ele, '<a href="' + ele + '">' + ele + '</a>');
        }
    }
    return body;
};

var timer2 = {};

function pop() {
    var id = this.innerText.substr(2);
    var content = $("#" + id).html().replace(/id="\w{8}" /, "");
    var x=$('<div class=\'pop\'>' + content + '</div>');
    x.appendTo(this);
    x.find(".popup").mouseover(pop);
    x.mouseover(function(){
      clearTimeout(timer2[id]);
    });
    x.mouseout(function() {
      timer2[id] = setTimeout(function() {
            $('.pop').fadeOut('normal');
        }, 600);
    });
}

function update(data) {
    for (var i = 0; i < data.length; i++) {
        var t = data[i].body;
        data[i].body = (t.startsWith("@markdown")) ? marked(t.substring("@markdown".length)) : tohtml(t);
    }
    $("#msg").html(tmpl.render({
        msgs: data
    }));
    $(".popup").mouseover(pop);
    listen();
}
var file = document.forms[0].file.value;
var records = $("#records").text() | 0;

if (location.hash.length == 33) $.getJSON("/gateway.cgi/api/thread?f=" + file + "&i=" + location.hash.substr(1), update);
else $.getJSON("/gateway.cgi/api/thread?f=" + file + "&n=" + (records - 40), update);