var JSTDate = function (str) {  return ISODate(str + "T00+09:00");  };
var query  = { "time" : { "$gte" : JSTDate("2013-06-01"), "$lt" : JSTDate("2013-07-01") } };
use fluentd
var m = function () { 
	var getYMDH = function (d) { 
		d.setSeconds(0); 
		d.setMilliseconds(0); 
		d.setMinutes(0); 
		yy = d.getFullYear(); 
		mm = d.getMonth() + 1; 
		dd = d.getDate(); 
		hh = d.getHours(); 
		if (mm < 10) { mm = "0" + mm; } 
		if (dd < 10) { dd = "0" + dd; } 
		if (hh < 10) { hh = "0" + hh; } 
		return yy + '-' + mm + '-' + dd + ' ' + hh + ':00:00'; 
	}; 
	emit({time: getYMDH(this.time), host: this.host}, 1); 
};
var r = function(key,values) { return Array.sum(values); };
db.apache_access.mapReduce(m,r, { query : query , out : {replace: "tmp_time"}, verbose: false } );
db.tmp_time.find({"value" : { $gt : 5 } }).forEach(printjsononeline);

