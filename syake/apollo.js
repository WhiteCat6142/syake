"use strict";

var crypto = require('crypto');
var bigint = require('bigint-node');

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


function varify(target,sign,pubkey){
    for(var result="", lines=0;result.length-lines < pubkey.length;lines++) {
        result+=pubkey.substr(result.length-lines,64)+"\n"
    }
    pubkey="-----BEGIN PUBLIC KEY-----\n"+result+"-----END PUBLIC KEY-----";
    console.log(pubkey);
const verify = crypto.createVerify('RSA-MD5');
//console.log(crypto.getCiphers());
//var md5 = crypto.createHash('md5').update(target, 'utf8').digest('hex');
//console.log(md5);
//md5=md5.slice(0,63);
verify.write(target);
verify.end();
//console.log(verify.verify(pubkey, sign,"base64"));
//var decipher = crypto.createDecipher('rsa', pubkey);
//decipher.update(sign, 'hex', 'utf8');
//var dec = decipher.final('utf8');
//console.log(dec);
/*
var n=bigint.ParseFromString(new Buffer(pubkey,"base64").toString("hex"),16);
var c=bigint.ParseFromString(new Buffer(sign,"base64").toString("hex"),16);
var e=bigint.FromInt(65537);
console.log(n.powMod);
var m=bigint.powMod(c,e,n);
console.log(bigint.bigInt2str(c,16))
*/
pubkey="-----BEGIN PUBLIC KEY-----\n\
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkRWAQ0O9LgBoHNAB5m1X\n\
8e1sPTzKmBTPCFTSRTzw0AjZozIbN4nIp/3jnQHTbcY0Bf5MDWmtdheSK1a+ew34\n\
YcgN2b9Shr+3yZv9PJ97i7gRCqOnI7jbm7PXFBNw1I4aMYc6tV7TKFzvx6008/nY\n\
vN3Jey6Z8ItS/FLQRDkV9m/WQkhJpYgvmD6qiwj9d+un+moBQ5/PPgn7Qkg5GyxZ\n\
Uy9PsblUDSrIA0bEiv/wQOXCYUvL9OFzxTUSeIHpdGibhPQVxX3Jnpr293Iq/mOK\n\
n3ZO+xBID26m3L8+ik64wte041y1S4HHaE9Q082ai/uBduAwIHcJY5VAHborZYCS\n\
aQIDAQAB\n\
-----END PUBLIC KEY-----"
console.log(pubkey);
var dec = crypto.publicDecrypt({key:pubkey,padding:crypto.RSA_NO_PADDING},new Buffer(sign,"base64"));
console.log(dec)
};

a="NzA2NDEyOSw5MTExMjcwLDQ4MjA0NTcsMjY1ODc4MSw5ODA5NDA4LDI4NTI3OTIsNDQ4NTczNCwyMzUxNDQ2LDcxNjM4MDgsOTI1MDA3NywyODYwNzUsNTgxODYzNyw3Mzg2NjY1LDM4MjA0MDIsNzg2NTkzNiw4NDI5MTYwLDY5NjkzMzYsNzAwNTA1NCw0NDEyNDU5LDU1MTc1OTMsNDQ1Njc4LDE5MTE5"
b="NjA2NzQyMSwyMjQ3ODQsNjg4MDU1OCw4Nzk5NjQ1LDgzODk2MjQsNDQ5NTEyOCw2MDI4NTY0LDg3NDc4NDMsODY1NjU0NSw4NDExNDA5LDg0MDAwNjgsNDE4MTkxNiwzODIzNDYsNzUzMzgwOSwyMzA1MTEyLDMwNjE0MSw3ODk4NDc5LDkzMzI3MjIsOTA4MDMyOCw3MzgzMjE5LDU4NDI2OTgsMzE5MTU1"
console.log(new Buffer(a,base64).)

var result1 = varify("body:&gt;&gt;f9f5dae8<br>文字列とリストは同じように扱えるからね。<br>文字列は変更不可オブジェクトで、リストは変更可能オブジェクトという違いはあるが。<>name:白帽子",
    "JLYlqbhL1hO0mIpnYIRvz7FyerE+dIT/aP3UuAVQEIiix5tJBmg7y4WUKEB1EcCzuWbz0eCE37Ax7o8HeyOwLA",
    "7iIuGXJ/jFbB8yfUzISydn2vhi33O8ZnPNJBvQKiDxo60RWUgSPk+Ch2X82EVIGT2GmMF1FPDXCMS1wwWlQzRA"
);
var result2 = varify("body:test",
"DmjCwvX8DMpsEr30bGB8XIXMgTO6Iwz8Yb5Q0CjACoqZK1kvkYluXjiW3n24QMzZ5qPb3Z49JLPV4ekLL0yRJA",
"DpmzfQSOhbpxE7xuaiEao3ztv9NAJi/loTs2N43f5hC3XpT3z9VhApcrYy94XhMBKONo5H14c8STrriPJnCcVA"
);
console.log(result1,result2);

//1462245355<>5de48357846c2e88967e6ea10543aa0f<>
//
//<>pubkey:
//key=test
//<>sign:
//<>target:body,stamp,file_name

function test(){
    var key="DpmzfQSOhbpxE7xuaiEao3ztv9NAJi/loTs2N43f5hC3XpT3z9VhApcrYy94XhMBKONo5H14c8STrriPJnCcVA";
    var sign="peTxFudKnbhL5ntBeNhn3Q+YQfMQTJ1BgCnMz8lRHCiet80+5yLmqJfEaWFclabdVRPiaqmGADw64wnNDXWDTA";
    var body="body:test<>stamp:1462245355<>file_name:thread_E38386E382B9E38388";
    
}