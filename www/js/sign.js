function genkey(k) {
    var pq = md5(k) + md5(k + "pad1") + md5(k + "pad2") + md5(k + "pad3");
    var p = s(pq.substring(0, 56)),
        q = s(pq.substring(56, 128));

    var e = int2bigInt(65537, 17);
    var test = int2bigInt(0x7743, 15);
    var x1 = int2bigInt(1, 1);
    var d = null,
        n = null;

    p[14] |= 1 << 5;
    q[18] |= 1 << 9;

    for (var ii = 0; ii < 300; ii++) {
        p = primize(p);
        q = primize(q);

        sub_(p, x1);
        sub_(q, x1);
        var phi = mult(q, p);
        addInt_(p, 1);
        addInt_(q, 1);

        d = inverseMod(e, phi);
        if (isZero(d)) continue;

        n = mult(q, p);

        var t = test;
        t = powMod(t, e, n);
        t = powMod(t, d, n);
        if (equals(test, t)) break;

        addInt_(p, 2);
        addInt_(q, 2);
    }
    console.log(toB(d)); //sec
    console.log(toB(n)); //pub
    return {
        pub: n,
        pri: d
    };
}

var en = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toB(x) {
    x = dup(x);
    var r = "";
    while (!isZero(x)) {
        r += en[modInt(x, 64)];
        rightShift_(x, 6);
    }
    while (r.length < 86) r += "A";
    return r;
}

function s(str) {
    var tmp = int2bigInt(0, 288);
    var i = str.length / 2;
    while (i--) {
        leftShift_(tmp, 4);
        addInt_(tmp, parseInt(str[i * 2], 16));
        leftShift_(tmp, 4);
        addInt_(tmp, parseInt(str[i * 2 + 1], 16));
    }
    return tmp;
}

var primes = findPrimes(30000);

function primize(ans) {
    var k = bitSize(ans);

    ans[0] |= 1;

    if (rpprb.length != ans.length)
        rpprb = dup(ans);

    for (;;) {
        var divisible = 0;

        //check ans for divisibility by small primes up to B
        for (var i = 0; i < primes.length; i++) {
            if (modInt(ans, primes[i]) == 0) {
                divisible = 1;
                break;
            }
        }

        //do n rounds of Miller Rabin, with random bases less than ans
        for (var i = 0; i < 12 && !divisible; i++) {
            randBigInt_(rpprb, k, 0);
            while (!greater(ans, rpprb)) //pick a random rpprb that's < ans
                randBigInt_(rpprb, k, 0);
            if (!millerRabin(ans, rpprb))
                divisible = 1;
        }

        if (!divisible)
            return ans;

        addInt_(ans, 2);
    }
}

//if(genkey("test").pub!="DpmzfQSOhbpxE7xuaiEao3ztv9NAJi/loTs2N43f5hC3XpT3z9VhApcrYy94XhMBKONo5H14c8STrriPJnCcVA")throw "err";

var zero = int2bigInt(0, 1024)

function fromS(str) {
    var tmp = dup(zero);
    var i = str.length;
    while (i--) {
        leftShift_(tmp, 8);
        addInt_(tmp, str.charCodeAt(i));
    }
    return tmp;
}
function target(f) {
    var target=[],re=[];
    if(f.name.value!==""){target.push("name");re.push("name:"+f.name.value);}
    if(f.mail.value!==""){target.push("mail");re.push("mail:"+f.mail.value);}
    if(f.body.value!==""){target.push("body");re.push("body:"+f.body.value);}
    target.push("file_name");re.push("file_name:"+f.file.value);
    return {t:target.join(","),r:re.join("<>")};
}

function sign(mes, key) {
    return toB(powMod(fromS(md5(mes)), key.pri, key.pub));
}