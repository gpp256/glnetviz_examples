/*
 * [[[ mmglu ]]] WebGL Utility library for JavaScript
 *   Copyright (c) 2009 Utano Mayonaka.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/* merge functions into mmglu namespace. */
mmglu = {
	generateParticle: function (flag) {
		var volume = 120;
		var life   = 1800;
		var delay  = 2500;
		var limit  = 0;
		var minspeed = 0.5;
		var maxspeed = 2.0;
		var range = [2.0, 2.0];
		var dimension = [0, 1, 1];
		if (flag) {
		var ssize = 0.2; var esize = 2.1;
		} else {
		var ssize = 0.0; var esize = 0.0;
		}
		var scolor = [0.4, 0.2, 0.0, 0.4 ];
		var ecolor = [0.2, 0.2, 0.2, 0.0];
		var smove = [0.0, 4.0, 0.0];
		var emove = [0.0, 2.0, 0.0];
		var wind = [0.0, 4.0, 0.0];
		var minrot = 0;
		var maxrot = 0;
		var imgpath = 'smoke.png';
		var pos = [0.0, 0.0, 0.0];

		return this.createParticle(
			volume,             //_iVolume
			life, delay,        //_iLife, _fDelay
			limit,              //_iCount
			minspeed, maxspeed, //_fMinSpeed, _fMaxSpeed
			range,              //_aRange
			dimension,          //_aDimension
			wind,               //_aWind
			ssize, esize,       //_fStartSize, _fEndSize
			scolor, ecolor,     //_aStartColor,_aEndColor,
			smove, emove,       //_aStartMove, _aEndMove
			minrot, maxrot      //_iMinRot, _iMaxRot
		);
	},

	initParticleShader: function (psg) {
		gl.useProgram(psg);
		psg.attribList = {};
		psg.attribList["aParticlePos"] = gl.getAttribLocation(psg, "aParticlePos");
		gl.enableVertexAttribArray(psg.attribList["aParticlePos"]);
		psg.attribList['aParticleTc'] = gl.getAttribLocation(psg, 'aParticleTc');
		gl.enableVertexAttribArray(psg.attribList['aParticleTc']);
		psg.attribList['aParticleMovS'] = gl.getAttribLocation(psg, 'aParticleMovS');
		gl.enableVertexAttribArray(psg.attribList['aParticleMovS']);
		psg.attribList['aParticleMovE'] = gl.getAttribLocation(psg, 'aParticleMovE');
		gl.enableVertexAttribArray(psg.attribList['aParticleMovE']);
		psg.attribList['uParticleP'] = gl.getUniformLocation(psg, 'uParticleP');
		psg.attribList['uParticleMV'] = gl.getUniformLocation(psg, 'uParticleMV');
		psg.attribList['uParticleSizeS'] = gl.getUniformLocation(psg, 'uParticleSizeS');
		psg.attribList['uParticleSizeE'] = gl.getUniformLocation(psg, 'uParticleSizeE');
		psg.attribList['uParticleColorS'] = gl.getUniformLocation(psg, 'uParticleColorS');
		psg.attribList['uParticleColorE'] = gl.getUniformLocation(psg, 'uParticleColorE');
		psg.attribList['uParticleCount'] = gl.getUniformLocation(psg, 'uParticleCount');
		psg.attribList['uParticleTime'] = gl.getUniformLocation(psg, 'uParticleTime');
		psg.attribList['uParticleLife'] = gl.getUniformLocation(psg, 'uParticleLife');
		psg.attribList['uParticleWind'] = gl.getUniformLocation(psg, 'uParticleWind');
		psg.attribList['uSampler'] = gl.getUniformLocation(psg, 'uSampler');
		psg.attribList['uUseTexture'] = gl.getUniformLocation(psg, 'uUseTexture');
	},

	getParticleVertexShader: function () {
		var hoge = "attribute vec3 aParticlePos;\n"
		+"attribute vec4 aParticleMovS;\n"
		+"attribute vec4 aParticleMovE;\n"
		+"attribute vec2 aParticleTc;\n"
		+"uniform mat4 uParticleP;\n"
		+"uniform mat4 uParticleMV;\n"
		+"uniform float uParticleTime;\n"
		+"uniform float uParticleLife;\n"
		+"uniform float uParticleCount;\n"
		+"uniform float uParticleSizeS;\n"
		+"uniform float uParticleSizeE;\n"
		+"uniform vec3 uParticleWind;\n"
		+"uniform vec4 uParticleColorS;\n"
		+"uniform vec4 uParticleColorE;\n"
		+"varying vec4 vColor;\n"
		+"varying vec2 vTexCrd;\n"
		+"varying float vRot;\n"
		+"void main(void) {\n"
		+"  if (uParticleTime-aParticleMovE.w < 0.0 || (uParticleCount > 0.0\n"
		+"    && (uParticleCount * uParticleLife + aParticleMovE.w)-uParticleTime < 0.0)) {;\n"
		+"    gl_Position = uParticleP * uParticleMV * vec4(aParticlePos*uParticleSizeS, 1.0);\n"
		+"    vColor = vec4(0.0, 0.0, 0.0, 0.0);\n"
		+"  } else {;\n"
		+"    float t = mod(uParticleTime- aParticleMovE.w, uParticleLife);\n"
		+"    float p = t / uParticleLife;\n"
		+"    float size = uParticleSizeS*(1.0-p) + uParticleSizeE*p;\n"
		+"    vec3 movePos = aParticlePos*size + aParticleMovS.xyz * t * (1.0-p);\n"
		+"    movePos += aParticleMovE.xyz * t * p;\n"
		+"    movePos += uParticleWind * t * p;\n"
		+"    gl_Position = uParticleP * uParticleMV * vec4(movePos, 1.0);\n"
		+"    vRot = aParticleMovS.w * t * (aParticleMovS.x/abs(aParticleMovS.x));\n"
		+"    vColor = uParticleColorS*(1.0-p) + uParticleColorE*p;\n"
		+"    vTexCrd = aParticleTc;\n"
		+"}}";
		return hoge;
	},

	getParticleFragmentShader: function () {
		var hoge = ""
		+"precision mediump float;\n"
		+"uniform sampler2D uSampler;\n"
		+"uniform bool uUseTexture;\n"
		+"varying vec4 vColor;\n"
		+"varying vec2 vTexCrd;\n"
		+"varying float vRot;\n"
		+"void main(void) {\n"
		+"  if (uUseTexture) {\n"
		+"    mat2 texRot = mat2(vec2(cos(vRot), -sin(vRot)), vec2(sin(vRot), cos(vRot)));\n"
		+"    vec2 texCrd = vec2(vTexCrd.s-0.5, vTexCrd.t-0.5) * texRot;\n"
		+"    texCrd = vec2(texCrd.s+0.5, texCrd.t+0.5);\n"
		+"    vec4 texture = texture2D(uSampler, texCrd);\n"
		+"    gl_FragColor = texture*vColor;\n"
		+"  } else {\n"
		+"    gl_FragColor = vColor;\n"
		+"}}";
		return hoge;
	},

	createParticle: function (
		_iVolume, _iLife, _fDelay, _iCount,
		_fMinSpeed, _fMaxSpeed,
		_aRange, _aDimension, _aWind,
		_fStartSize, _fEndSize,
		_aStartColor, _aEndColor,
		_aStartMove, _aEndMove,
		_iMinRot, _iMaxRot) 
	{
		var model = this.createModel(), r, speed, range;
		
		_aEndMove = (_aEndMove)? _aEndMove : _aStartMove;
		_fDelay = (_fDelay > _iLife)? _iLife : _fDelay;
		_iMaxRot = (typeof(_iMaxRot)=='undefined')? _iMinRot : _iMaxRot;
		
		r = (_iMaxRot>_iMinRot)? _iMaxRot-_iMinRot : 0;
		speed = (_fMaxSpeed > _fMinSpeed)? _fMaxSpeed-_fMinSpeed : _fMinSpeed-_fMaxSpeed;
		range = _aRange[1]-_aRange[0];
		
		var center=vPos=vp=vs=ve=tc=idx=[], dest, force, i;
		center.twoPI = Math.PI*2;
	
		for (i=0;i<_iVolume;i++) {
			center.rZ = Math.random()*center.twoPI;
			center.rY = Math.random()*center.twoPI;
			center.x = _aRange[0]+range*Math.random();
			center.y = center.x * Math.sin(center.rZ);
			center.x = center.x * Math.cos(center.rZ) * _aDimension[0];
			center.z = center.y * Math.sin(center.rY) * _aDimension[2];
			center.y = center.y * Math.cos(center.rY) * _aDimension[1];
			
			vp =   [center.x-1, center.y-1, center.z,
				center.x+1, center.y-1, center.z,
				center.x-1, center.y+1, center.z,
				center.x+1, center.y+1, center.z];
			
			tc = tc.concat([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
			force = i*4;
			idx= idx.concat([force,force+1,force+2,force+3,force+2,force+1]);
			
			vs = this.unitVec3([center.x, center.y, center.z]);
			ve = this.unitVec3([center.x, center.y, center.z]);
			
			force = speed*Math.random()+_fMinSpeed;
			dest = [];
			dest[0] = (_aStartMove[0]!=0)? _aStartMove[0] * force : vs[0] * force;
			dest[1] = (_aStartMove[1]!=0)? _aStartMove[1] * force : vs[1] * force;
			dest[2] = (_aStartMove[2]!=0)? _aStartMove[2] * force : vs[2] * force;
			dest[3] = (_iMinRot+r*Math.random())*Math.PI/180;
			
			vs = dest.concat(dest, dest, dest);
			
			force = speed*Math.random()+_fMinSpeed;
			dest = [];
			dest[0] = (_aEndMove[0]!=0)? _aEndMove[0] * force : ve[0] * force;
			dest[1] = (_aEndMove[1]!=0)? _aEndMove[1] * force : ve[1] * force;
			dest[2] = (_aEndMove[2]!=0)? _aEndMove[2] * force : ve[2] * force;
			dest[3] = _fDelay/1000*Math.random()
			
			ve = dest.concat(dest, dest, dest);
			
			vPos.push([vp,vs,ve]);
		}
		vPos.sort(cmp_dist);
		function cmp_dist(a, b) {
			return a[0][2]-b[0][2];
		}
		vp=vs=ve=[];
		for (i=0;i<vPos.length;i++) {
			vp = vp.concat(vPos[i][0]);
			vs = vs.concat(vPos[i][1]);
			ve = ve.concat(vPos[i][2]);
		}
		
		model.vertexPosition = vp;
		model.vertexColor    = vs;
		model.vertexNormal   = ve;
		model.textureCoord   = tc;
		model.vertexIndex    = idx;
		model.mode = gl.TRIANGLES;
		model.element = true;
		model['particle'] = true;
		model['render'] = 'drawParticle';
		model['life'] = _iLife;
		model['count'] = _iCount;
		model['startSize'] = _fStartSize;
		model['endSize'] = (typeof(_fEndSize)!='undefind')? _fEndSize : _fStartSize;
		model['startColor'] = _aStartColor;
		model['endColor'] = (_aEndColor)? _aEndColor : _aStartColor;
		model['wind'] = (_aWind)? _aWind : [0,0,0];
		model['time'] = new Date().getTime();
		
		this.bindModelBuffer(model);
		
		return model;
	},

	bindModelBuffer: function (model) {
		var i; 
		var data = ['vertexPosition','vertexColor','vertexIndex','textureCoord','vertexNormal'];
		for (i=0;i<5;i++) {
			this.setModelParam(i, model, model[data[i]]);
		}
	},

	setModelParam: function (_i, _model, _modeldata) { 
		var buffer = ['vpBuffer','vcBuffer','viBuffer','tcBuffer','vnBuffer'];
		var size = [3,4,1,2,3];
		var param = ['vpParam','vcParam','viParam','tcParam','vnParam'];
		var target;
		
		if (typeof(_modeldata) == 'object' && _modeldata) {
			if (_modeldata.length > 0) {
				(!_model[buffer[_i]])? _model[buffer[_i]] = gl.createBuffer() : null;//buffer
				(!_model[param[_i]])? _model[param[_i]] = [] : null;
				(!_model[param[_i]][0])? _model[param[_i]][0] = gl.FLOAT : null;// type
				if (!_model[param[_i]][1]) {
					_model[param[_i]][1] = (_i==2)? gl.STREAM_DRAW : gl.STATIC_DRAW;// usege
				}
				(!_model[param[_i]][2])? _model[param[_i]][2] = 0 : null;// normal flag
				(!_model[param[_i]][3])? _model[param[_i]][3] = 0 : null;// str_ide
				(!_model[param[_i]][4])? _model[param[_i]][4] = 0 : null;// offset;
				if (_modeldata.name != 'Float32Array') {
					_modeldata = (size[_i]!=1)? new Float32Array(_modeldata)
						: new Uint16Array(_modeldata);
				}
				target = (_i==2)? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;// target
				gl.bindBuffer(target, _model[buffer[_i]]);
				gl.bufferData(target, _modeldata, _model[param[_i]][1]);
				_model[buffer[_i]].itemSize = size[_i];
				_model[buffer[_i]].numItems = _modeldata.length / size[_i];
			}
		} else {
			_model[param[_i]] = null;
		}
	},

	createModel: function (
		_aVp, _aVc, _aIdx, _aTc, _aVn,
		_iElement, _iMode, _iFirst,
		_v3Pos, _v3Rot, _v3Scale, model) 
	{
		model = [];
		model['name']   = 'particle';
		model['draw']   = true;
		model['isLook'] = false;
		model['render'] = 'drawModel';
		model['element']= (_iElement)?_iElement: false;
		model['mode']   = (_iMode)?   _iMode   : gl.TRIANGLES;
		model['first']  = (_iFirst)?  _iFirst  : 0;
		model['pos']    = (_v3Pos)?   _v3Pos   : [0,0,0];
		model['rot']    = (_v3Rot)?   _v3Rot   : [0,0,0];
		model['scale']  = (_v3Scale)? _v3Scale : [1,1,1];
		model['vertexPosition'] = (_aVp)? _aVp : null;
		model['vertexColor']    = (_aVc)? _aVc : null;
		model['textureCoord']   = (_aTc)? _aTc : null;
		model['vertexIndex']    = (_aIdx)?_aIdx: null;
		model['vertexNormal']   = (_aVn)? _aVn : null;
		model['vpBuffer'] = null;
		model['vcBuffer'] = null;
		model['tcBuffer'] = null;
		model['viBuffer'] = null;
		model['vnBuffer'] = null;
		model['vpParam']  = null;
		model['vcParam']  = null;
		model['tcParam']  = null;
		model['viParam']  = null;
		model['vnParam']  = null;
		model['texture']  = null;
		model['preDraw']  = null;
		model['afterDraw']  = null;
		model['rotMatrix']  = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
		model['view']  = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
		return model;
	},

	unitVec3: function (_aV, res, r) {
		res = [];
		r = Math.sqrt(_aV[0] * _aV[0] + _aV[1] * _aV[1] + _aV[2] * _aV[2]);
		res[0] = (r != 0)? _aV[0] / r : 0;
		res[1] = (r != 0)? _aV[1] / r : 0;
		res[2] = (r != 0)? _aV[2] / r : 0;
		return res;
	},

	drawParticle: function (psg, pos, model, m, pMatrix) {
		glnv.mvPushMatrix();
		m.translate(glnv.mMatrix, pos, glnv.mMatrix);
		m.rotate(glnv.mMatrix, glnv.degToRad(-g.scrollX), [0, 1, 0], glnv.mMatrix);
		m.rotate(glnv.mMatrix, glnv.degToRad(-22.0), [0, 1, 0], glnv.mMatrix);
		if (model.particle) {
			if (model.count > 0 && 
				new Date().getTime() > (model.time + model.life * (model.count+1))) return;
			gl.uniformMatrix4fv(psg.attribList['uParticleP'], false, pMatrix);
			gl.uniformMatrix4fv(psg.attribList['uParticleMV'], false, glnv.mMatrix);
			gl.uniform1f(psg.attribList['uParticleSizeS'], model.startSize);
			gl.uniform1f(psg.attribList['uParticleSizeE'], model.endSize);
			gl.uniform4f(psg.attribList['uParticleColorS'],
				model.startColor[0], model.startColor[1], model.startColor[2], model.startColor[3]);
			gl.uniform4f(psg.attribList['uParticleColorE'],
				model.endColor[0], model.endColor[1], model.endColor[2], model.endColor[3]);
			gl.uniform1f(psg.attribList['uParticleCount'], model.count);
			gl.uniform1f(psg.attribList['uParticleTime'], (new Date().getTime() - model.time)/1000);
			gl.uniform1f(psg.attribList['uParticleLife'], model.life/1000);
			gl.uniform3f(psg.attribList['uParticleWind'], model.wind[0], model.wind[1], model.wind[2]);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, model.vpBuffer);
			gl.vertexAttribPointer(psg.attribList["aParticlePos"],
				model.vpBuffer.itemSize, model.vpParam[0], 
				model.vpParam[2], model.vpParam[3], model.vpParam[4]);
			gl.bindBuffer(gl.ARRAY_BUFFER, model.vcBuffer);
			gl.vertexAttribPointer(psg.attribList['aParticleMovS'],
				4, model.vcParam[0], model.vcParam[2], model.vcParam[3], model.vcParam[4]);
			gl.bindBuffer(gl.ARRAY_BUFFER, model.vnBuffer);
			gl.vertexAttribPointer(psg.attribList['aParticleMovE'],
				4, model.vnParam[0], model.vnParam[2], model.vnParam[3], model.vnParam[4]);
			gl.bindBuffer(gl.ARRAY_BUFFER, model.tcBuffer);
			gl.vertexAttribPointer(psg.attribList['aParticleTc'],
				2, model.tcParam[0], model.tcParam[2], model.tcParam[3], model.tcParam[4]);
	
			if (model.texture) {
			gl.uniform1i(psg.attribList['uUseTexture'], true);
			gl.uniform1i(psg.attribList['uSampler'], 8);
			} else {
			gl.uniform1i(psg.attribList['uUseTexture'], false);
			}
			if (model.vertexIndex) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.viBuffer);
		}
		if (model.element) {
		gl.drawElements(model.mode, model.viBuffer.numItems, gl.UNSIGNED_SHORT, model.first);
		} else {
		gl.drawArrays(model.mode, model.first, model.vpBuffer.numItems);
		}
		glnv.mvPopMatrix();
	}
};
// __END__
