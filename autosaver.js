var fs = require('fs');

//acress o=sync("sample.json","json",{readonly:true});o.something

exports.sync = function(file,type,option){
	var o = {};
	option=option||{};
	if(type=="json"){
		option.reader = JSON.parse;
		option.writer = JSON.stringify;
	}
	o=option.reader(fs.readFileSync(file,"utf-8")||"{}");
	fs.watch(file,function(event,filename){
		fs.readFile(file,"utf-8",function(err,data){
		console.log(data);
		console.log(event);
		o=option.reader(data);
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