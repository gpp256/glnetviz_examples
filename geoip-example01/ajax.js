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

// load objects
function loadObject () {
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

// get geolocation
function getGeolocation (index, ipaddr) {
	var id = index - 1;
    	$.ajax({
		url: "./get_geolocation.cgi?id="+id+"&ip="+ipaddr,
		type: "GET",
		data: {},
		contentType: "application/json",
		dataType: "json",
		success: function(msg) {  
			if (msg['ret'] != 0) return;
			$("#geolocation").text("id="+msg['id']+", c_code="
				+msg['c_code']+", city="+msg['city']
				+", lat="+msg['lat']+", lon="+msg['lon']+"\n");
			if (g.atklist == undefined) return;
			if (msg['lat'] != undefined) msg['lat'] = $.sprintf("%.1f", parseFloat(msg['lat']));
			if (msg['lon'] != undefined) msg['lon'] = $.sprintf("%.1f", parseFloat(msg['lon']));
			if (g.atklist[msg['id']] != undefined ) delete g.atklist[msg['id']];
			g.atklist[msg['id']] = [ 
				msg['lat'], msg['lon'], 35.7, 139.6, 100, 
				msg['ipaddr'], msg['c_code'], msg['city']
			];
			g.getflow_updateflag = 1;
		},
		error: function() { $("#result").text( "Error: getGeolocation(): failed to get the location."); },
		complete: undefined
	});
}
