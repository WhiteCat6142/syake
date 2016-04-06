"use strict";

const fs = require('fs');

//acress o=sync("sample.json","json",{readonly:true});o.something

exports.sync = function(file,type,option){
	var o = {};
	if(option){}
	else if(type=="json"){
		option=option||{};
		option.reader = JSON.parse;
		option.writer = JSON.stringify;
		option.def="{}"
	}else if(type=="text"){
		option=option||{};
		option.def="";
	}else{option=option||{};}
	o=option.reader(fs.readFileSync(file,"utf-8")||option.def);
	fs.watch(file,function(event,filename){
		setImmediate(function() {
		fs.readFile(file,"utf-8",function(err,data){
        if(err)return;
		console.log(data);
		console.log(event);
		if(option.reader)o=option.reader(data);
		else o=data;
		});
	    });
	});
	if(!option.readonly)Object.observe(o,function(changes){
		console.log(changes);
		if(option.ignore){option.ignore=false;return;}
		option.ingore=true;
		fs.writeFile(file,option.writer(o),function(err){});
	});
	return o;
};

exports.read=function(path,type) {
	var o={};
	o.data=conv(fs.readFileSync(path,"utf-8"),type);
	fs.watch(path,function(event,path0){
		if(event!=="change")return;
		setImmediate(function() {
			fs.readFile(path,"utf-8",function(err,data){
				if(!err)o.data=conv(data,type);
			});
		});
	});
	return o;
};
function conv(data,type) {
	switch(type){
		case "json":return JSON.parse(data||"{}");
		case "txt":return data||"";
		default: return data; 
	}
}