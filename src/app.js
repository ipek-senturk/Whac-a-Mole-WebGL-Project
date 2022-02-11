var gl;

window.onload = function init() {

	var canvas = document.getElementById('game-surface');
	gl = WebGLUtils.setupWebGL(canvas);
	

	if (!gl) {
		alert("WebGL isn't available.");
	}

	var moleVertices = 
	[   // X   Y     Z     U  V
		// Top
		-1.0, 1.0, -1.0,    0, 0,
		-1.0, 1.0,  1.0,    0, 1,
		 1.0, 1.0,  1.0,    1, 1, 
		 1.0, 1.0, -1.0,    1, 0, 

		// Left
		-1.0,  1.0,  1.0,   1, 0,
		-1.0, -1.0,  1.0,   1, 1,
		-1.0, -1.0, -1.0,   0, 1,
		-1.0,  1.0, -1.0,   0, 0,

		// Right
		1.0,  1.0,  1.0,    0, 0,  
		1.0, -1.0,  1.0,    0, 1,   
		1.0, -1.0, -1.0,    1, 1,  
		1.0,  1.0, -1.0,    1, 0,  

		// Front
		 1.0,  1.0, 1.0,    1, 0,
		 1.0, -1.0, 1.0,    1, 1,
		-1.0, -1.0, 1.0,    0, 1, 
		-1.0,  1.0, 1.0,    0, 0,

		// Back
		 1.0,  1.0, -1.0,   0, 0,
		 1.0, -1.0, -1.0,   0, 1,
		-1.0, -1.0, -1.0,   1, 1,
		-1.0,  1.0, -1.0,   1, 0,

		// Bottom
		-1.0, -1.0, -1.0,   1, 1,
		-1.0, -1.0,  1.0,   1, 0,
		 1.0, -1.0,  1.0,   0, 0,
		 1.0, -1.0, -1.0,   0, 1
	];

	var moleIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.5, 0.9, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Create buffer
	var moleVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moleVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(moleVertices), gl.STATIC_DRAW);

	var moleIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moleIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(moleIndices), gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var textCoordAttribLocation = gl.getAttribLocation(program, 'vertTexPosition');
	gl.vertexAttribPointer(
		positionAttribLocation,
		3,
		gl.FLOAT,
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT, 
		0
	);
	gl.vertexAttribPointer(
		textCoordAttribLocation,
		2,
		gl.FLOAT, 
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT, 
		3 * Float32Array.BYTES_PER_ELEMENT
	);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(textCoordAttribLocation);

	// Create Texture
    var moleTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, moleTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);	

	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
		gl.UNSIGNED_BYTE,
		document.getElementById('mole-image')
		);
	gl.bindTexture(gl.TEXTURE_2D, null);

	var matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'matView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'matProj');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [9, 0, 30], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var xTranslationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);
	var lastCode;
	
	function keyFunction(event){
		lastCode=event.code;
	}
	
	function mousepos(event){
		var x = [event.offsetX,event.offsetY];
		pointy = -(x[1]/40);
		pointy = pointy.toFixed(2);
		pointx = -(20-(x[0]/40));
		pointx = pointx.toFixed(2);
		points = [pointx,pointy];
		score = score+((10+((-Math.abs(points[0]-cube_x)) + (-Math.abs(points[1]-cube_y)))));
		
		if (score >=100){
			alert("You won!");
			score = 0;
		}
		if (score <=-50){
			alert("Game over! :(");
			score = 0;
		}
		document.getElementById("score").innerHTML= "Score = "+score.toFixed(0);
	}
	
	function random(){ 
		ax=Math.floor(Math.random()*20)-10;
		az=Math.floor(Math.random()*20)-10;
		y = Math.floor(Math.random()*20)-10;
	}
	
	function run(){
		rand=setInterval(random,1000);
	}
	run();
	addEventListener("click", mousepos);
	addEventListener("keydown", keyFunction);
	
	
	var status= "up";
	var y = 0;
	var x=1;
	var score=0;
	var ax=0;
	var az=0;
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	var angle = 0;
	var loop = function () {
		angle = performance.now() / 1000 / 6 * 2 * Math.PI;
		cube_y=y-10;
		cube_y=cube_y.toFixed(2);
		cube_x=ax-10;
		cube_x=cube_x.toFixed(2);
		cube_z=az;
		cube_z=cube_z.toFixed(2);
		if (status == "up"){
			befstat=status;
			y += 0.01;
			if (y>5.9){
				status ="down";
			}
		}
		if (status =="down"){
			befstat=status;
			y -= 0.01;
			if (y<-5.9){
				status="up";
			}
		}
		if(lastCode == "KeyP"){
			lastCode = "KeyP";
			status="stop";
			x=0;
			clearInterval(rand);
			document.getElementById("score").innerHTML= "PAUSED";
		}
		if(lastCode == "Space"){
			lastCode= "KeyR";
			status = befstat;
			x=1;
			document.getElementById("score").innerHTML= "Score = "+score.toFixed(0);
			run();
		}

		mat4.rotate(yRotationMatrix, identityMatrix, 0, [0, 1, 0]);
		mat4.translate(xTranslationMatrix, identityMatrix, [ax, y, az]);
		mat4.mul(worldMatrix, yRotationMatrix, xTranslationMatrix);
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

		gl.bindTexture(gl.TEXTURE_2D, moleTexture);
		gl.activeTexture(gl.TEXTURE0);
		gl.drawElements(gl.TRIANGLES, moleIndices.length, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(loop);
	};

	requestAnimationFrame(loop);
	addEventListener("keydown", keyFunction);
};