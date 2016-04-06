"use strict";

$("#changes").click(function(){
    this.parentNode.removeChild(this);
    $.ajax({url:"/gateway.cgi/api/changes",timeout:10000,success: function(d){
        console.log(d);
        var tmpl = Hogan.compile($('#tmpl').text());
        $("#threads").html(tmpl.render({ts:JSON.parse(d)}));
    }});
});