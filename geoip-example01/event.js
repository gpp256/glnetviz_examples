/*!
 * event.js
 *
 * Copyright (c) 2012 Yoshi 
 * This software is distributed under the MIT License.(../../MIT-LICENSE.txt)
 */


// Initialize global variables
// parameters for slider ui
g.globals = {};
g.scale = 1;
g.xaxis_rotate_param = 5;
// parameters for keyboard event
g.xRot = 0;
g.xSpeed = 0;
g.yRot = 0;
g.ySpeed = -0;
g.currentlyPressedKeys = {};
g.lastTime = 0;

// check a input data and get the geolocation of the specified ip address.
function ckIPAddr(index, ikey){
	var ipaddr = document.search_form[ikey].value;
	var default_list = [
		[46.0, 2.0, 35.7, 139.6, 100, '81.1.1.1', 'FR', ''],
		[-6.2, 106.8, 35.7, 139.6, 50, '114.1.1.1', 'ID', 'Jakarta'],
		[4.8, -75.7, 35.7, 139.6, 25, '186.0.1.1', 'CO', 'Pereira']
	];
	$("#result").text('');
	if (ipaddr.match(/^(([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)) {
		getGeolocation(index, ipaddr);
	} else {
		delete g.atklist[index-1];
		g.atklist[index-1] = default_list[index-1];
		document.search_form[ikey].value = default_list[index-1][5];
		$("#result").text("Invalid IP Address: "+parseInt(index));
		g.getflow_updateflag = 1;
	}
}

// initialize ui
function initUI() {
	$(".perspective-enable").click(function(){
		var parent = $(this).parents('.switch');
		if (window.confirm('透視投影に切り替えます。よろしいですか?')) {
			$('.perspective-disable',parent).removeClass('selected');
			$(this).addClass('selected');
			togglePerspective(1);
		} else {
		}
	});
	$(".perspective-disable").click(function(){
		var parent = $(this).parents('.switch');
		if (window.confirm('平行投影に切り替えます。よろしいですか?')) {
			$('.perspective-enable',parent).removeClass('selected');
			$(this).addClass('selected');
			togglePerspective(0);
		} else {
		}
	});
	$('#perspective-disable').addClass('selected');
	$('#perspective-enable').removeClass('selected');
	togglePerspective(0);
}

// initialize webgl
function initWebGL (c) {
	c.width = 700; c.height = 580;
	// webglコンテキストを取得
	gl = c.getContext('webgl', { antialias: true }) || 
		c.getContext('experimental-webgl', { antialias: true });
    if (!gl) { alert("Error: failed to get webgl context, sorry :-("); return; }
	// set event listeners
	c.addEventListener("mousedown", handleMouseDown, false);
	c.addEventListener("mousemove", handleMouseMove, false);
	c.addEventListener("mouseup", handleMouseUp, false);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

	// カリングと深度テストを有効化
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	gl.cullFace(gl.FRONT_AND_BACK);
}

// create slider ui
function createSliderUI() {
	var uiElem = document.getElementById('ui');
	for (var ii = 0; ii < g_ui.length; ++ii) {
	  var ui = g_ui[ii];
	  var obj = g[ui.obj];
	  obj[ui.name] = ui.value;
	  var div = document.createElement('div');
	  setupSlider($, div, ui, obj);
	  uiElem.appendChild(div);
	}
}

// update framerate
function updateFramerates () {
	var nowtime = new Date().getTime();
	var difftime = nowtime - g.rendertime;
	if (difftime == 0) return;
	var f = 1000/difftime;
	g.framerates.push(f); 
	if (g.framerates.length>10) g.framerates.shift();
	g.rendertime = nowtime;
}

// display framerate
function displayFramerate () {
	var sum = 0;
	for (var i = 0; i < g.framerates.length; i++) 
		sum+= g.framerates[i];
	var f = Math.round(sum/g.framerates.length);
	$('#framerate').text('Framerate: '+f+" fps");
}

// toggle perspective
function togglePerspective(flag) {
	g.view_mode = (flag) ? 1 : 0;
}

// handle key up event
function handleKeyUp(event) {
    g.currentlyPressedKeys[event.keyCode] = false;
}

// handle key down event
function handleKeyDown(event) {
    g.currentlyPressedKeys[event.keyCode] = true;
    if (String.fromCharCode(event.keyCode) == "S") {
        g.xSpeed = 0; g.ySpeed = 0;
    }
}

// handle key events
function handleKeys() {
    if (g.currentlyPressedKeys[37]) {
        // Left cursor key
        g.ySpeed -= 1;
    }
    if (g.currentlyPressedKeys[39]) {
        // Right cursor key
        g.ySpeed += 1;
    }
    if (g.currentlyPressedKeys[38]) {
        // Up cursor key
        g.xSpeed -= 1;
    }
    if (g.currentlyPressedKeys[40]) {
        // Down cursor key
        g.xSpeed += 1;
    }
}

// rotate objects 
function animate() {
	var timeNow = new Date().getTime();
	if (g.lastTime != 0) {
	    var elapsed = timeNow - g.lastTime;
	    g.xRot += (g.xSpeed * elapsed) / 1000.0;
	    g.yRot += (g.ySpeed * elapsed) / 1000.0;
	}
	g.lastTime = timeNow;
}

// set ui parameters
function setParam(event, ui, obj, name) {
	var id = event.target.id;
	var value = ui.value / 1000;
	if (value < 1) value = 0;
	if (name == 'Scale') {
		if (value < 1) value = 1;
		$('#scale_slider').text($.sprintf(": % 4d", value));
		g.scale = value;
	} else if (name == 'Rotation around the x-axis') {
		$('#xaxis_rotation_slider').text($.sprintf(": % 4d", value));
		g.xaxis_rotate_param = value;
	}
	obj[id] = value;
}

// get ui values
function getUIValue(obj, id) {
	return obj[id] * 1000;
}

// setup sliders
function setupSlider($, elem, ui, obj) {
	var labelDiv = document.createElement('div');
	labelDiv.appendChild(document.createTextNode(ui.name));
	var sliderDiv = document.createElement('div');
	sliderDiv.id = ui.name;
	elem.appendChild(labelDiv);
	elem.appendChild(sliderDiv);
	$(sliderDiv).slider({
		range: false,
		step: 1,
		max: ui.max * 1000,
		min: ui.min,
		value: getUIValue(obj, ui.name),
		slide: function(event, ui) { setParam(event, ui, obj, sliderDiv.id); }
	});
	$(sliderDiv).css({"margin-bottom" : "6px"});
	
	if (ui.name == 'Scale') {
		$('#scale_slider').text($.sprintf(": % 4d", ui.value));
		g.scale = ui.value;
	} else if (ui.name == 'Rotation around the x-axis') {
		$('#xaxis_rotation_slider').text($.sprintf(": % 4d", ui.value));
		g.xaxis_rotate_param = ui.value;
	}
}
