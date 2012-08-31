var FtpClient  = require("ftp"),
	util = require("../util");

exports.match = function(url){
	return url.split("/")[2].toLowerCase()==="ftp.sec.noaa.gov";
}

exports.process = function(work, callback){
	var conn = new FtpClient({host: work.url.split("/")[2]});
	conn.on("connect", function(){
		conn.auth(function(err){
			conn.get(work.url.split("/").slice(3).join("/"), function(err, stream){
				if(err){
					callback(true, work);
				} else{
					var buff = "";
					stream.on("data", function(data){
						if(!work.responseTime) {
							work.responseTime = new Date();
						}
						buff+=data.toString();
					})
					.on("end", function(){
						work.body = buff;
						work.data = work.extractData(work.body);
						work.md5 =  util.md5(work.data);
						work.header = "";
						util.writeCache(work, function(){
							callback(false, work);
						});
					});
				}
			});
		})
	})
	.connect();
}

exports.extractData = function(data){
	var re = /^[\d\s\.e-]+$/;
	return data.toString()
			.split("\n")
			.filter(function(line){
				return line.search(re)!=-1;
			})
			.join("\n");;
}