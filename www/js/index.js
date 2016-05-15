"use strict";

var tmpl = Hogan.compile($('#tmpl').text());

window.onload=function(){document.getElementById("cmd").value="post";};

function update(url){
    $.ajax({url:url,timeout:10000,success: function(d){
        $("#threads").html(tmpl.render({ts:JSON.parse(d)}));
    }});
}

$("#changes").click(function(){
    this.parentNode.removeChild(this);
    update("/gateway.cgi/api/changes");
});

$(".tag").click(function(){
    var tag=this.innerText;
    update("/gateway.cgi/api/changes?tag="+tag);
});