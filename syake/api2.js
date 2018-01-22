"use strict";

const crypto = require('crypto');
const escape = require('escape-html');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const co = require('co');
const check = require('./apollo');

exports.update = new EventEmitter();

exports.config = JSON.parse(fs.readFileSync(process.env.config || "./file/config.json", "utf-8"));
exports.port = exports.config.port;

if (exports.config.db.client == "pg") {
    const pg = require('pg');
    pg.defaults.ssl = true;
}

if (process.env.DATABASE_URL) exports.config.db.connection = process.env.DATABASE_URL;

const knex = require('knex')(exports.config.db);

var spamt = fs.readFileSync("file/spam.txt", "utf-8");

knex.schema.hasTable('threads').then(function(exists) {
    if (exists) return;
    knex.schema.createTable("threads", function(table) {
        table.increments("tid").primary();
        table.integer("stamp").notNullable().index();
        table.integer("records").notNullable().defaultTo(0);
        table.string("title").unique().notNullable();
        table.integer("dat").unique().notNullable();
        table.string("file").unique().notNullable();
        table.integer("laststamp");
        table.string("lastid", 32);
    }).then();

    knex.raw("CREATE TABLE spam (id CHAR(32) NOT NULL UNIQUE);").then();
    knex.raw("CREATE TABLE tag (id INTEGER NOT NULL,tag TEXT NOT NULL,UNIQUE(id,tag));").then(function() {
        knex.raw("CREATE index tiindex on tag(id);").then();
        knex.raw("CREATE index ttindex on tag(tag);").then();
    });
    knex.schema.createTable("unknown", function(table) {
        table.increments("tid").primary();
        table.string("file").unique().notNullable();
        table.string("title").unique().notNullable();
        table.string("node").notNullable();
    }).then();
});
if (exports.config.image) fs.mkdir("./cache");

exports.threads = {
    get: function(option) {
        var s = knex.select("*", knex.raw("group_concat(tag.tag) as tag")).from("threads");
        if (option.time) s = s.whereRaw(times(option.time));
        if (option.sort) s = s.orderBy("stamp", "desc");
        if (option.limit) s = s.limit(option.limit);
        s = s.leftJoin("tag", "tid", "id").groupBy("tid");
        if (option.tag) s = s.having("COUNT(tid)", ">=", option.tag.length).whereIn("tag", option.tag);
        s = s.then(function(rows) {
            for (var t of rows) {
                if (t.tag) t.tag = t.tag.split(",");
            }
            return rows; <<
            <<
            << < HEAD
        }, function() { return []; });
        if (option.addDate) return s.then(exports.addDate);
        return s;
    },
    create: function(title, callback) {
        const t = now();
        const file = threadFile(title);
        console.log("newThread:" + t + " " + t + " " + file + " " + title);
        knex.transaction(function(trx) {
            return co(function*() {
                try {
                    yield trx.raw("CREATE TABLE " + file + " (stamp INTEGER NOT NULL,id CHAR(32) NOT NULL,content TEXT NOT NULL,UNIQUE(id,stamp)));");
                    yield trx("threads").insert({ stamp: t, title: title, dat: t, file: file });
                    yield trx.raw("CREATE index " + file + "_sindex on " + file + "(stamp);");
                    yield trx("unknown").where("file", file).del();
                    if (exports.config.image) fs.mkdir("./cache/" + file, callback);
                    else setImmediate(callback);
                } catch (e) { console.log(e); }
            });
        });
    },
    info: function(option) {
        var s = knex.select("stamp", "records", "title", "file", "dat").from("threads");
        if (option.file) s = s.where("file", option.file);
        else if (option.title) s = s.where("title", option.title);
        else if (option.dat) s = s.where("dat", option.dat);
        return s.then(function(rows) {
            if (rows.length == 1) return Promise.resolve(rows[0]);
            console.log("wanted:" + exports.getTitle(option.file));
            knex.select("file").from("unknown").where("file", file).then(function(rows) {
                if (rows.length == 0) exports.update.emit("wanted", option.file);
            }).catch(function() {});
            return Promise.reject();
        });
    }
};
exports.thread = {
        get: function(file, option) {
            var s = knex.select((option.head) ? ["stamp", "id"] : undefined).from(file);
            if (option.time) s = s.whereRaw(times(option.time));
            if (option.id) s = s.andWhere("id", option.id);
            if (option.limit && option.offset && (option.offset >= 0)) s = s.whereBetween("rowid", [option.offset, (option.limit + option.offset - 1)]);
            return s.orderBy("stamp", "asc").catch(function() { return []; });
        },
        post: function(file, stamp, id, body) {
            try {
                if (!body) throw "Empty Message";
                var ss = spamt.split("[\n\r]+");
                for (var s of ss) {
                    if (body.match(s)) { throw "spam"; }
                }
                const md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
                if (id) { if (md5 != id) { throw "Abnormal MD5"; } } else { id = md5; }
                check(file, stamp, id, conv()({ content: body, id: id }));
                if (body.indexOf("attach:") != -1) {
                    if (!exports.config.image) {
                        body = body.replace(/attach:[^(<>)]*/g, ("attach:none"));
                    } else {
                        const suffix = body.match(/suffix:([^(<>)]*)/)[1];
                        const attach = body.match(/attach:([^(<>)]*)/)[1];
                        const data = new Buffer(attach, "base64");
                        const md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                        const name = md5 + "." + suffix;
                        body = body.replace(/attach:[^(<>)]*/g, ("attach:" + name));
                        fs.writeFile("./cache/" + file + "/" + name, data, { flag: "wx" }, function(err) { if (!err) console.log(name); });
                    }
                }
                var b2 = body.match(/\[\[[^(\]\])]*\]\]/g);
                if (b2) {
                    for (var j = 0; j < b2.length; j++) {
                        const file = b2[j].slice(2, -2);
                        exports.threads.info({ title: file }).catch(function() { exports.update.emit("wanted", file); });
                    }
                }
                add(file, stamp | 0, id, body);
            } catch (e) {
                knex("spam").insert({ id: id }).then(); ===
                ===
                =
            },
            function() { return []; });
        if (option.addDate) return s.then(exports.addDate);
        return s;
    },
    create: function(title, callback) {
        const t = now();
        const file = threadFile(title);
        console.log("newThread:" + t + " " + t + " " + file + " " + title);
        knex.transaction(function(trx) {
            return co(function*() {
                try {
                    yield trx.raw("CREATE TABLE " + ff(file) + " (stamp INTEGER NOT NULL,id CHAR(32) NOT NULL,content TEXT NOT NULL);");
                    yield trx("threads").insert({ stamp: t, title: title, dat: t, file: file });
                    yield trx.raw("CREATE index " + ff(file, 55) + "_sindex on " + ff(file) + "(stamp);");
                    yield trx("unknown").where("file", file).del();
                    if (exports.config.image) fs.mkdir("./cache/" + file, callback);
                    else setImmediate(callback);
                } catch (e) { console.log(e); }
            });
        });
    },
    info: function(option) {
        var s = knex.select("stamp", "records", "title", "file", "dat").from("threads");
        if (option.file) s = s.where("file", option.file);
        else if (option.title) s = s.where("title", option.title);
        else if (option.dat) s = s.where("dat", option.dat);
        return s.then(function(rows) {
            if (rows.length == 1) return Promise.resolve(rows[0]);
            console.log("wanted:" + exports.getTitle(option.file));
            knex.select("file").from("unknown").where("file", file).then(function(rows) {
                if (rows.length == 0) exports.update.emit("wanted", option.file);
            }).catch(function() {});
            return Promise.reject();
        });
    }
};
exports.thread = {
    get: function(file, option) {
        var s = knex.select((option.head) ? ["stamp", "id"] : undefined).from(ff(file));
        if (option.time) s = s.whereRaw(times(option.time));
        if (option.id) s = s.andWhere("id", option.id);
        if (option.limit && option.offset && (option.offset >= 0)) s = s.limit(option.limit).offset(option.offset);
        return s.orderBy("stamp", "asc").catch(function(e) { console.log(e); return []; });
    },
    post: function(file, stamp, id, body) {
        try {
            if (!body) throw "Empty Message";
            var ss = spamt.data.split("[\n\r]+");
            for (var s of ss) {
                if (body.match(s)) { throw "spam"; }
            }
            const md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex');
            if (id) { if (md5 != id) { console.log(id); throw "Abnormal MD5"; } } else { id = md5; }
            check(file, stamp, id, conv()({ content: body, id: id }));
            if (body.indexOf("attach:") != -1) {
                if (!exports.config.image) { throw "no file mode"; }
                const suffix = body.match(/suffix:([^(<>)]*)/)[1];
                const attach = body.match(/attach:([^(<>)]*)/)[1];
                const data = new Buffer(attach, "base64");
                const md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex');
                const name = md5 + "." + suffix;
                body = body.replace(/attach:[^(<>)]*/g, ("attach:" + name));
                fs.writeFile("./cache/" + file + "/" + name, data, { flag: "wx" }, function(err) { if (!err) console.log(name); });
            }
            add(file, stamp | 0, id, body);
        } catch (e) {
            knex("spam").insert({ id: id }).then(); >>>
            >>>
            > he
            console.log(e);
            console.log(id + " " + body.substr(0, 32));
        }
    },
    convert: function(file, option) {
        return exports.thread.get(file, option).then(function(rows) {
            return rows.map(conv(file));
        });
    },
    addTag: function(file, tag) {
        knex.select("tid").from("threads").where("file", file).then(function(rows) {
            return knex("tag").insert({ id: rows[0].tid, tag: tag });
        }).catch(function() {});
    }
};

exports.tag = function() { return knex("tag").distinct("tag").select(); };

exports.spam = function(id) {
    return knex.select("id").from("spam").where("id", id).then(function(rows) {
        if (rows.length == 0) return Promise.resolve();
        else return Promise.reject();
    }, function() { return Promise.resolve(); });
};

exports.post = function(file, name, mail, body, time, subject, sign) {
    //if(subject)exports.threads.create(subject);
    exports.threads.info(file).then(function(row) {
        var s = "";
        if (mail) s += "mail:" + escape(mail) + "<>";
        if (name) s += "name:" + escape(name) + "<>";
        s += "body:" + escape(body).replace(/\r\n|\r|\n/g, "<br>");
        if (sign) {
            s += "<>";
            s += "file_name:" + file.file + "<>";
            s += "pubkey:" + sign.pubkey + "<>";
            s += "sign:" + sign.sign + "<>";
            s += "target:" + sign.target;
        }
        exports.thread.post(row.file, time || now(), null, s);
    });
};

function add(file, stamp, id, content) {
    knex.transaction(function(trx) { <<
                <<
                << < HEAD
                return co(function*() {
                            console.log("update:" + file + " " + stamp + " " + id + " " + content.substring(0, 16));
                            yield Promise.all([
                                trx("threads").where("file", file).update({ stamp: now(), laststamp: stamp, lastid: id, records: trx.raw("records + 1") }),
                                trx(file).insert({ stamp: stamp, id: id, content: content }) ===
                                ===
                                =
                                return co(function*() {
                                    yield trx.raw("LOCK TABLE " + ff(file) + " IN ACCESS EXCLUSIVE MODE;");
                                    var rows = yield trx.select("stamp", "id").from(ff(file)).whereBetween("stamp", [stamp - aday, stamp + aday]).andWhere("id", id);
                                    if (rows.length > 0) {
                                        if (stamp !== rows[0].stamp) console.log("duplicate post!");
                                        return;
                                    }
                                    exports.update.emit('update', file, stamp, id, content);
                                    console.log("update:" + file + " " + stamp + " " + id + " " + content.substring(0, 16));
                                    yield Promise.all([
                                        trx("threads").where("file", file).update({ stamp: now(), laststamp: stamp, lastid: id, records: trx.raw("records + 1") }),
                                        trx(ff(file)).insert({ stamp: stamp, id: id, content: content }) >>>
                                        >>>
                                        > he
                                    ]);
                                    exports.update.emit('update', file, stamp, id, content);
                                });
                            });
                        }

                        exports.addDate = function(rows) {
                            var time = "";
                            for (var i = 0; i < rows.length; i++) {
                                time = new Date(rows[i].stamp * 1000).toString();
                                rows[i].date = time.substring(0, time.lastIndexOf(" GMT"));
                            }
                            return rows;
                        };

                        function conv(file) {
                            return function(row) {
                                var time = undefined;
                                if (row.stamp) {
                                    time = new Date(row.stamp * 1000).toString();
                                    time = time.substring(0, time.lastIndexOf(" GMT"));
                                } <<
                                <<
                                << < HEAD
                                const r = { date: time, id: row.id.substr(0, 8) };
                                const content = row.content.split("<>");
                                for (var j of content) {
                                    var x = j.match(/^([a-z_]*):(.*)/);
                                    if (x) r[x[1]] = x[2];
                                }
                                r.body = r.body || "";
                                r.body = escape(r.body.replace(/<br>/g, "\n")).replace(/\n/g, "<br>").replace(/&amp;/g, "&");
                                if (file && r.attach) r.body += "<br>http://" + exports.host + "/file/" + file + "/" + r.attach; ===
                                ===
                                =
                                const r = { date: time, id: row.id.substr(0, 8) };
                                const content = row.content.split("<>");
                                for (var j of content) {
                                    var x = j.match(/^([a-z_]*):(.*)/);
                                    if (x) r[x[1]] = x[2];
                                }
                                r.body = r.body || "";
                                r.body = escape(r.body.replace(/<br>/g, "\n")).replace(/\n/g, "<br>");
                                if (file && r.attach) r.body += "<br>https://" + exports.host + "/file/" + file + "/" + r.attach; >>>
                                >>>
                                > he
                                return r;
                            };
                        }
                        exports.conv = conv;

                        exports.notice = function(file, node) {
                            knex.select("file").from("unknown").where("file", file).then(function(rows) {
                                if (rows.length > 0) return;
                                const title = exports.getTitle(file);
                                exports.update.emit("notice", file, title, node);
                                return knex("unknown").insert({ node: node.replace(/\//g, "+"), file: file, title: title });
                            }).catch(function() {});
                        }; exports.unkownThreads = function() {
                            return knex.select().from("unknown").orderBy("id", "desc");
                        };

                        function threadFile(title) { return "thread_" + new Buffer(title).toString("hex").toUpperCase(); };

                        exports.getTitle = function(file) { return new Buffer(file.substring("thread_".length).toLowerCase(), "hex").toString(); };

                        function now() { return Math.round(Date.now() / 1000); }

                        function times(time) {
                            const x = time.split("-");
                            var s = "stamp ";
                            if (x.length == 1) return s + "= " + (x[0] | 0);
                            if (x[1] == "") return s + ">= " + (x[0] | 0);
                            if (x[0] == "") return s + "<= " + (x[1] | 0);
                            return s + "between " + (x[0] | 0) + " and " + (x[1] | 0);
                        }

                        function ff(file, x) {
                            return file.substr(0, x || 63).toLowerCase();
                        }