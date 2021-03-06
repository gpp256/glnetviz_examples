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
// parameters for colorbar
g.CT = undefined;

// initialize ui
function initUI() {
	// localize
	var lang = glnv.browserLanguage();
	if (lang == undefined || lang != 'ja') lang = "en";
	var opts = { language: lang, pathPrefix: "../../lib/locale", skipLanguage: "en" };
	$("[data-localize]").localize("common", opts);
	// toggle perspective
	togglePerspective(0);
	// show colorbar
	g.CT = glnv.generateColorTable();
	drawColorBar(0.0);
}

function drawColorBar(val) {
	// initialize
	var canvas = document.getElementById('colorbar');
	if ( ! canvas || ! canvas.getContext ) return;
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 15;
	ctx.shadowBlur    = 3;
	ctx.shadowColor   = 'rgba(0, 0, 0, 0.5)';
	ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
	ctx.lineWidth   = 2;

	// show colorbar
	for (var i=0; i<200; i++) {
		ctx.translate(1, 0.0);
		ctx.fillStyle = "rgba("+g.CT[i][0]+", "+g.CT[i][1]+", "+g.CT[i][2]+", 1.0)";
		ctx.fillRect(0, 10, 1, 40);
	}
	ctx.translate(-200, 0.0);

	// show loadavg	
	var max = 10.0;
	if (val > 10.0) val = 10.0; 
	var pos = val/10.0
	ctx.beginPath();
	ctx.moveTo(pos*200, 0);
	ctx.lineTo(pos*200, 60);
	ctx.stroke();
	ctx.closePath();
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

function changeNetworkTopologies(sb) {
	g.getstat_counter = 470;
	getSdnObjects(sb.value);
	getOtherObjects(sb.value);
	getFlowData(sb.value);
	g.flowdata_id = sb.value;
}
