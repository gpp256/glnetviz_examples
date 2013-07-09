/*!
 * ajax.js
 *
 * Copyright (c) 2013 Yoshi 
 * This software is distributed under the MIT License.(../MIT-LICENSE.txt)
 */

// get rotation array
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
			if (type == 'flow') 
				g.drawinfo_flows[msg['id']]['rot'] = msg['rot'];
			else
				g.rinfo['rot'] = msg['rot'];
		},
        error: function() { $("#debug").append(
			"Error: getRotationArray(): failed to get a rotation array."); },
        complete: undefined
    });
}

// load objects
function loadObject () {
    $.ajax({
        url: "./get_connection_array.cgi?start=a&stop=b",
        type: "GET",
        data: {},
        contentType: "application/json",
        dataType: "json",
		success: function(msg) { 
			g.conn_list = msg; 
			checkConnectionList();
			
		},
        error: function() { $("#debug").append(
			"Error: loadObject(): failed to get connection parameters"); },
        complete: undefined
    });
}

function checkConnectionList() {
	var radius = 0.6371; // 0.6371
	for (var i=0; i<g.conn_list.length; i++) {
		var src_x = glnv.degToRad(g.conn_list[i][8])*radius;
		var src_y = glnv.degToRad(g.conn_list[i][7])*radius;
		var dst_x = glnv.degToRad(g.conn_list[i][10])*radius;
		var dst_y = glnv.degToRad(g.conn_list[i][9])*radius;
		Array.prototype.push.apply(g.conn_list[i], [src_x, src_y, dst_x, dst_y]);
		g.drawinfo_flows.push({
			start: [ src_x, src_y, 0.0], 
			end: [ dst_x, dst_y, 0.0],
			color: 'blue',
			size: 0.09,
			//labelinfo: {size: 0.05, ypos: 0.05},
			//value: g.conn_list[i][5]
		});
		getRotationArray(g.drawinfo_flows.length-1,
			[dst_x, dst_y, 0.0].join(','), [src_x, src_y, 0.0].join(','), 'flow'
		);
	}
}
