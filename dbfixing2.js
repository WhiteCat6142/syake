module.exports=function(knex) {
    knex.schema.dropTable("tag").then(function() {
        return knex.raw("CREATE TABLE tag (id INTEGER NOT NULL,tag TEXT NOT NULL,UNIQUE(id,tag));");
    }).then(function(){
        knex.raw("CREATE index tiindexx on tag(id);").then();
        knex.raw("CREATE index ttindexx on tag(tag);").then();
    });
    knex.schema.dropTable("ttt").then();
    knex.schema.createTable("unknown", function (table) {
        table.increments("tid").primary();
        table.string("file").unique().notNullable();
        table.string("title").unique().notNullable();
        table.string("node").notNullable();
    }).then();
};