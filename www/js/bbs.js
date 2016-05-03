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
      /*
function genkey(k) {
  var cry=window.crypto.subtle;
  var pq=md5(k)+md5(k+"pad1")+md5(k+"pad2")+md5(k+"pad3");
  var p=pq.substr(0,7),q=pq.substr(7,9);
  var e=0x100001;
  p=p|Math.pow(2,215);q=q|Math.pow(2,279);
  base
};
*/