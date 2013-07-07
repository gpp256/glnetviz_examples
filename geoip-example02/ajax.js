/*!
 * ajax.js
 *
 * Copyright (c) 2013 Yoshi 
 * This software is distributed under the MIT License.(../../MIT-LICENSE.txt)
 */

// get rotation arrays
function getRotationArray (id, src, dst, type) {
	if(typeof type === 'undefined') type = 'default';
    $.ajax({
        url: "../../lib/cgi/get_rotation_array.cgi?src="+src+"&dst="+dst+"&id="+id,
        type: "GET",
        data: {},
        contentType: "application/json",
        dataType: "json",
		success: function(msg) {  
			if (msg['ret'] != 0) return 0;
			if (type == 'gw') 
				g.drawinfo_gwflows[msg['id']]['rot'] = msg['rot'];
			else 
				g.drawinfo_flows[msg['id']]['rot'] = msg['rot'];
		},
        error: function() { $("#debug").text(
			"Error: getRotationArray(): failed to get a rotation array."); },
        complete: undefined
    });
}

// read the access log
function readAccessLog () {
	$.ajax({
		url: "./apache01.cgi?",
		type: "GET",
		data: {},
		contentType: "application/json",
		dataType: "json",
		success: function(msg) {  
			g.accesslog = msg;
			g.read_accesslog = 1;
			g.getflow_updateflag = 1;
		},
		error: function() { $("#debug").text(
		"Error: readAccessLog(): failed to get the access log"); },
		complete: undefined
	});
}

// load objects
function loadObject () {
	if (g.read_accesslog != 1) return;
	if (!(g.last_time+":00:00" in g.accesslog)) return;
	var logs = g.accesslog[g.last_time+":00:00"];
	g.atklist = [];
	for (var i=0; i<logs.length; i++) {
		g.atklist.push([
			logs[i]['lat'], logs[i]['lon'], 35.7, 139.6, 
			logs[i]['num'], logs[i]['ip'], logs[i]['code'], ''
		]);
	}
	// Japan: lat=35.7, lon=139.6
	// e.g.
	// fromlat, fromlon, tolat, tolon, npkt, ipaddr, c_code, city
	for (var i=0; i<g.atklist.length; i++) {
	if (g.atklist[i] == undefined) continue;
    	$.ajax({
    	    url: "./get_objpos.cgi?id="+i+"&fromlat="+g.atklist[i][0]+"&fromlon="+g.atklist[i][1]+
				 "&tolat="+g.atklist[i][2]+"&tolon="+g.atklist[i][3],
    	    type: "GET",
    	    data: {},
    	    contentType: "application/json",
    	    dataType: "json",
			success: function(msg) {  
				if (msg['ret'] != 0) return 0;
				g.atkinfo[msg['id']] = {
					rot  : msg['rot'],
					start: msg['start'],
					end  : msg['end'],
					flows: msg['flows'],
					readflag: 0,
					lonlat: g.atklist[msg['id']]
				};
			},
    	    error: function() { $("#debug").text(
				"Error: loadObject(): failed to get object parameters"); },
    	    complete: undefined
    	});
	}
}
