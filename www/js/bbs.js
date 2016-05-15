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
  return {pub:keyn,pri:keyd};
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
  
  var primes = [];
function check(n){
    for(var j = 0;j<primes.length;j++){
        if(n%j==0)return false;
    }
    return true;
}
for(var i = 2;i<5000;i++){
    if(check(i))primes.push(i);
}


function pow(base, exponent, modulus) {
  if ((base < 1) || (exponent < 0) || (modulus < 1)) {
    return("invalid");
  }
  var result = 1;
  while (exponent > 0) {
    if ((exponent % 2) == 1) {
      result = (result * base) % modulus;
    }
    base = (base * base) % modulus;
    exponent = exponent>>1;
  }
return (result);
}


function spsp(n,a){
    if(n%2==0)return false;
    var n1=n-1;
    var d=n-1;
    var s=0;
    while(d%2!=0){
        d=Math.floor(d/2);
        s++;
    }
    
    var p = pow(a,d,n);
    
    if(p==1||p==n1)return true;
    for(var i = 1;i<s;i++){
        p=pow(p,2,n);
        if(p==n1)return true;
    }
    return false;
}


function s (str){
    var tmp =0;
    var i = str.length;
    while(i--){
        tmp=tmp*256+str.charCodeAt(i);
    }
    return tmp;
}

var e = 65537;
function varify(target,sign,pubkey){
    var md5 = crypto.createHash('md5').update(target, 'utf8').digest('hex');
    //var m = new Buffer(64).fill(0);
    //m.write(md5);
var i=31;
while(i--)md5=md5+'\0';
//var m = new Buffer(md5);
//console.log(md5);
    //m=m.readIntBE(0, 64);
    var m = s(md5);
    console.log(" "+m.toString(16));
    var c=new Buffer(sign, 'base64');
    c=c.readUIntLE(0, 64);
    var n =new Buffer(pubkey, 'base64');
    n=n.readUIntLE(0, 64);
    console.log(m+" "+n+" "+c+" "+md5);
    var x = pow(c,e,n);
    //n = pow(n,e,c);
    console.log(x.toString(16));
    return m==x;
}

a="NzA2NDEyOSw5MTExMjcwLDQ4MjA0NTcsMjY1ODc4MSw5ODA5NDA4LDI4NTI3OTIsNDQ4NTczNCwyMzUxNDQ2LDcxNjM4MDgsOTI1MDA3NywyODYwNzUsNTgxODYzNyw3Mzg2NjY1LDM4MjA0MDIsNzg2NTkzNiw4NDI5MTYwLDY5NjkzMzYsNzAwNTA1NCw0NDEyNDU5LDU1MTc1OTMsNDQ1Njc4LDE5MTE5"
b="NjA2NzQyMSwyMjQ3ODQsNjg4MDU1OCw4Nzk5NjQ1LDgzODk2MjQsNDQ5NTEyOCw2MDI4NTY0LDg3NDc4NDMsODY1NjU0NSw4NDExNDA5LDg0MDAwNjgsNDE4MTkxNiwzODIzNDYsNzUzMzgwOSwyMzA1MTEyLDMwNjE0MSw3ODk4NDc5LDkzMzI3MjIsOTA4MDMyOCw3MzgzMjE5LDU4NDI2OTgsMzE5MTU1"
//console.log(new Buffer(a,base64))

//if(genkey("test").pub!="DpmzfQSOhbpxE7xuaiEao3ztv9NAJi/loTs2N43f5hC3XpT3z9VhApcrYy94XhMBKONo5H14c8STrriPJnCcVA")throw "err";
*/