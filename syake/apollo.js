"use strict";

var crypto = require('crypto');

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
    exponent = Math.floor(exponent / 2);
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

/*
function varify(target,sign,pubkey){
const verify = crypto.createVerify('rsa-sha256');
var md5 = crypto.createHash('md5').update(target, 'utf8').digest('binary');
md5=md5.slice(0,63);
verify.write(md5);
verify.end();
console.log(sign.verify(pubkey, sign,"base64"));
};
*/
var result1 = varify("body:&gt;&gt;f9f5dae8<br>文字列とリストは同じように扱えるからね。<br>文字列は変更不可オブジェクトで、リストは変更可能オブジェクトという違いはあるが。<>name:白帽子",
    "JLYlqbhL1hO0mIpnYIRvz7FyerE+dIT/aP3UuAVQEIiix5tJBmg7y4WUKEB1EcCzuWbz0eCE37Ax7o8HeyOwLA",
    "7iIuGXJ/jFbB8yfUzISydn2vhi33O8ZnPNJBvQKiDxo60RWUgSPk+Ch2X82EVIGT2GmMF1FPDXCMS1wwWlQzRA"
);
var result2 = varify("body:test",
"DmjCwvX8DMpsEr30bGB8XIXMgTO6Iwz8Yb5Q0CjACoqZK1kvkYluXjiW3n24QMzZ5qPb3Z49JLPV4ekLL0yRJA",
"DpmzfQSOhbpxE7xuaiEao3ztv9NAJi/loTs2N43f5hC3XpT3z9VhApcrYy94XhMBKONo5H14c8STrriPJnCcVA"
);
console.log(result1,result2);