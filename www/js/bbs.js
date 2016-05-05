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

function genkey(k) {
  var pq=md5(k)+md5(k+"pad1")+md5(k+"pad2")+md5(k+"pad3");
  console.log(pq.length);
  var p=s(pq.substring(0,28)),q=s(pq.substring(28,64));
  var e=bigInt(65537);
  var test=bigInt(0x7743);
  var keyd=null,keyn=null;
  p=p.or(Math.pow(2,215));q=q.or(Math.pow(2,279));
  for(var i=0;i<300;i++){
    p=primize(p);
    q=primize(q);
    var phi=p.prev().times(q.prev());
    keyd=modinv(e,phi);
    if(keyd.isZero())continue;
    keyn=p.times(q);
    var t=test.modPow(e,keyn).modPow(keyd,keyn);
    if(t.eq(test))break;
    p=p.plus(2);q=q.plus(2);
  }
  console.log(toB(keyd));//sec
  console.log(toB(keyn));//pub
};
function primize(i) {
  if(i.isEven())i=i.next();
  while(!i.isProbablePrime(8))i=i.plus(2);
  return i;
}
function modinv(a,n) {
  var s=a,t=n,u=bigInt.one,v=bigInt.zero;
  while(s.isPositive()){
    q=t.divide(s);
    var w1=t.subtract(q.times(s));
    t=s;
    s=w1;
    var w2=v.subtract(q.times(u));
    v=u;
    u=w2;
  }
  return v.add(n).mod(n);
}
var en="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
function toB(x){
  var r="";
  while(x.isPositive()){
    r+=en[x.mod(64).toJSNumber()];
    x=x.shiftRight(6);
  }
  return r;
  }
  
  
  
  
function fromS(str){
    var tmp =bigInt.zero;
    var i = str.length;
    while(i--){
        tmp=tmp.shiftLeft(8).add(str.charCodeAt(i));
    }
    return tmp;
}
	var dic = new Object();
	dic[0x41]= 0; dic[0x42]= 1; dic[0x43]= 2; dic[0x44]= 3; dic[0x45]= 4; dic[0x46]= 5; dic[0x47]= 6; dic[0x48]= 7; dic[0x49]= 8; dic[0x4a]= 9; dic[0x4b]=10; dic[0x4c]=11; dic[0x4d]=12; dic[0x4e]=13; dic[0x4f]=14; dic[0x50]=15;
	dic[0x51]=16; dic[0x52]=17; dic[0x53]=18; dic[0x54]=19; dic[0x55]=20; dic[0x56]=21; dic[0x57]=22; dic[0x58]=23; dic[0x59]=24; dic[0x5a]=25; dic[0x61]=26; dic[0x62]=27; dic[0x63]=28; dic[0x64]=29; dic[0x65]=30; dic[0x66]=31;
	dic[0x67]=32; dic[0x68]=33; dic[0x69]=34; dic[0x6a]=35; dic[0x6b]=36; dic[0x6c]=37; dic[0x6d]=38; dic[0x6e]=39; dic[0x6f]=40; dic[0x70]=41; dic[0x71]=42; dic[0x72]=43; dic[0x73]=44; dic[0x74]=45; dic[0x75]=46; dic[0x76]=47;
	dic[0x77]=48; dic[0x78]=49; dic[0x79]=50; dic[0x7a]=51; dic[0x30]=52; dic[0x31]=53; dic[0x32]=54; dic[0x33]=55; dic[0x34]=56; dic[0x35]=57; dic[0x36]=58; dic[0x37]=59; dic[0x38]=60; dic[0x39]=61; dic[0x2b]=62; dic[0x2f]=63;
function fromB(str){
	var bin = bigInt.zero;
	var i = str.length;
	while(i--){
    bin=bin.shiftLeft(6).add(dic[str.charCodeAt(i)]);
	}
	return bin;
}
function varify(m,sign,pubkey){
return fromS(md5(m)).eq(fromB(sign).modPow(65537,fromB(pubkey)));
}