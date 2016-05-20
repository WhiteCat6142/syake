window.onload = function () { document.getElementById("cmd").value = "post"; };
(function () {
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
})();

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