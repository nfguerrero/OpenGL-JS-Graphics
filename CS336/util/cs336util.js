

// Gets the graphics context from the window
function getGraphicsContext(canvasId) {
  // retrieve <canvas> element
  let canvas = document.getElementById(canvasId);

  // get graphics context - note that WebGL 2.0 seems
  // to be incompatible with the Chrome shader editor,
  // so use WebGL 1.0 for now
  //let context = canvas.getContext("webgl2");
  let context = canvas.getContext("webgl");
  if (!context) {
    console.log('Failed to get the rendering context for WebGL');
  }
  return context;
}

// Helper function to load and compile one shader (vertex or fragment)
function loadAndCompileShader(gl, type, source) {
  // Create shader object
  var shader = gl.createShader(type);
  if (shader == null) {
    console.log('unable to create shader');
    return null;
  }

  // Set the source code
  gl.shaderSource(shader, source);

  // Compile
  gl.compileShader(shader);

  // Check the result of compilation
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader);
    console.log('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Helper function compiles two shaders and creates shader program
function createProgram(gl, vshaderId, fshaderId) {

  // extract shader source code from the html
  var vshaderSource = document.getElementById(vshaderId).textContent;
  var fshaderSource = document.getElementById(fshaderId).textContent;

  // Load and compile shader code
  var vertexShader = loadAndCompileShader(gl, gl.VERTEX_SHADER, vshaderSource);
  var fragmentShader = loadAndCompileShader(gl, gl.FRAGMENT_SHADER, fshaderSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // Create a program object
  var program = gl.createProgram();
  if (!program) {
    return null;
  }

  // Attach the shader objects
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link the program object
  gl.linkProgram(program);

  // Check the result of linking
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    var error = gl.getProgramInfoLog(program);
    console.log('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

// allocates a gpu memory buffer and fills it with the given data
function createAndLoadBuffer(data)
{
  // request a handle for a chunk of GPU memory
  let buffer = gl.createBuffer();
  if (!buffer) {
	  console.log('Failed to create the buffer object');
	  return;
  }

  // "bind" the buffer as the current array buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // load our data onto the GPU (uses the currently bound buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // now that the buffer is filled with data, we can unbind it
  // (we still have the handle, so we can bind it again when needed)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return buffer;

}

// allocates a gpu memory buffer and fills it with the given data
function createAndLoadIndexBuffer(data)
{
  // request a handle for a chunk of GPU memory
  let buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  // "bind" the buffer as the current array buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

  // load our data onto the GPU (uses the currently bound buffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // now that the buffer is filled with data, we can unbind it
  // (we still have the handle, so we can bind it again when needed)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return buffer;
}

// allocates texture memory and loads the given image
function createAndLoadTexture(image)
{
  // ask the GPU to create a texture object
  textureHandle = gl.createTexture();

  // choose a texture unit to use during setup, defaults to zero
  // (can use a different one when drawing)
  // max value is MAX_COMBINED_TEXTURE_IMAGE_UNITS
  gl.activeTexture(gl.TEXTURE0);

  // bind the texture
  gl.bindTexture(gl.TEXTURE_2D, textureHandle);

  // load the image bytes to the currently bound texture, flipping the vertical
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // set default parameters to usable values
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // unbind
  gl.bindTexture(gl.TEXTURE_2D, null);

  return textureHandle;
}

function toRadians(degrees)
{
	return degrees * Math.PI / 180;
}

function toDegrees(radians)
{
	return radians * 180 / Math.PI;
}

// Helper function to create camera matrix based on the
// three given vectors
function createLookAtMatrix(eye, at, up){
  // in three.js, the Matrix4 lookAt() function only sets the
  // rotational part R. To translate as well, we need TR,
  // where T = makeTranslation(eye).  Then for a view matrix, the
  // whole thing needs to be inverted, so we invert R and T
  // and reverse the order, R'T'.  Since R is a rotation, we can
  // just invert it by transposing
	var temp = new THREE.Matrix4().makeTranslation(-eye.x, -eye.y, -eye.z);
	var view = new THREE.Matrix4().lookAt(eye, at, up).transpose();
	return view.multiply(temp);
}

// Helper function to create perspective matrix
function createPerspectiveMatrix (fovy, aspect, near, far) {
 var top, bottom, left, right;
 top = near * Math.tan(toRadians(fovy)/2);
 bottom = -top;
 right = top * aspect;
 left = -right;
 return new THREE.Matrix4().makePerspective(left, right, top, bottom, near, far);
}

//Returns elements of the transpose of the inverse of the modelview matrix.
function makeNormalMatrixElements(model, view)
{
  var n = new THREE.Matrix4().copy(view).multiply(model);
  n = new THREE.Matrix4().getInverse(n);
  n.transpose();
  // take just the upper-left 3x3 submatrix
  n = n.elements;
  return new Float32Array([
  n[0], n[1], n[2],
  n[4], n[5], n[6],
  n[8], n[9], n[10] ]);
}

// Creates data for vertices, colors, and normal vectors for
// a unit cube.  Return value is an object with three attributes
// vertices, colors, and normals, each referring to a Float32Array.
function makeCube()
{
	  // vertices of cube
	var rawVertices = new Float32Array([
	-0.5, -0.5, 0.5,
	0.5, -0.5, 0.5,
	0.5, 0.5, 0.5,
	-0.5, 0.5, 0.5,
	-0.5, -0.5, -0.5,
	0.5, -0.5, -0.5,
	0.5, 0.5, -0.5,
	-0.5, 0.5, -0.5]);

	var rawColors = new Float32Array([
	 // 1.0, 0.0, 0.0, 1.0,  // red
	 //  1.0, 0.0, 0.0, 1.0,  // red
	 //  1.0, 0.0, 0.0, 1.0,  // red
	 //  1.0, 0.0, 0.0, 1.0,  // red
	 //  1.0, 0.0, 0.0, 1.0,  // red
	 //  1.0, 0.0, 0.0, 1.0,  // red

  0.4, 0.4, 1.0, 1.0,  // Z blue
  1.0, 0.4, 0.4, 1.0,  // X red
  0.0, 0.0, 0.7, 1.0,  // -Z dk blue
  0.7, 0.0, 0.0, 1.0,  // -X dk red
  0.4, 1.0, 0.4, 1.0,  // Y green
  0.0, 0.7, 0.0, 1.0,  // -Y dk green

	// 1.0, 0.0, 0.0, 1.0,  // red
	// 0.0, 1.0, 0.0, 1.0,  // green
	// 0.0, 0.0, 1.0, 1.0,  // blue
	// 1.0, 1.0, 0.0, 1.0,  // yellow
	// 1.0, 0.0, 1.0, 1.0,  // magenta
	// 0.0, 1.0, 1.0, 1.0,  // cyan
	]);

	var rawNormals = new Float32Array([
	0, 0, 1,
	1, 0, 0,
	0, 0, -1,
	-1, 0, 0,
	0, 1, 0,
	0, -1, 0 ]);

	var indices = new Uint16Array([
	0, 1, 2, 0, 2, 3,  // z face
	1, 5, 6, 1, 6, 2,  // +x face
	5, 4, 7, 5, 7, 6,  // -z face
	4, 0, 3, 4, 3, 7,  // -x face
	3, 2, 6, 3, 6, 7,  // + y face
	4, 5, 1, 4, 1, 0   // -y face
	]);

	var verticesArray = [];
	var colorsArray = [];
	var normalsArray = [];
	for (var i = 0; i < 36; ++i)
	{
		// for each of the 36 vertices...
		var face = Math.floor(i / 6);
		var index = indices[i];

		// (x, y, z): three numbers for each point
		for (var j = 0; j < 3; ++j)
		{
			verticesArray.push(rawVertices[3 * index + j]);
		}

		// (r, g, b, a): four numbers for each point
		for (var j = 0; j < 4; ++j)
		{
			colorsArray.push(rawColors[4 * face + j]);
		}

		// three numbers for each point
		for (var j = 0; j < 3; ++j)
		{
			normalsArray.push(rawNormals[3 * face + j]);
		}
	}

	return {
		vertices: new Float32Array(verticesArray),
		colors: new Float32Array(colorsArray),
		normals: new Float32Array(normalsArray),
    numVertices: 36
	};
};


// given an instance of THREE.Geometry, returns an object
// containing raw data for vertices and normal vectors.
function getModelData(geom)
{
	var verticesArray = [];
	var normalsArray = [];
	var vertexNormalsArray = [];
	var reflectedNormalsArray = [];
	var count = 0;
	for (var f = 0; f < geom.faces.length; ++f)
	{
		var face = geom.faces[f];
		var v = geom.vertices[face.a];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);

		v = geom.vertices[face.b];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);

		v = geom.vertices[face.c];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);
		count += 3;

		var fn = face.normal;
		for (var i = 0; i < 3; ++i)
		{
			normalsArray.push(fn.x);
			normalsArray.push(fn.y);
			normalsArray.push(fn.z);
		}

		for (var i = 0; i < 3; ++i)
		{
			var vn = face.vertexNormals[i];
			vertexNormalsArray.push(vn.x);
			vertexNormalsArray.push(vn.y);
			vertexNormalsArray.push(vn.z);
		}

		for (var i = 0; i < 3; ++i)
		{
			var index = (count * 3 - 9) + 3 * i;
			vx = vertexNormalsArray[index];
			vy = vertexNormalsArray[index + 1];
			vz = vertexNormalsArray[index + 2];
			nx = normalsArray[index];
			ny = normalsArray[index + 1];
			nz = normalsArray[index + 2];
//	     nx = vertexNormalsArray[index];
//	      ny = vertexNormalsArray[index + 1];
//	      nz = vertexNormalsArray[index + 2];
//	      vx = normalsArray[index];
//	      vy = normalsArray[index + 1];
//	      vz = normalsArray[index + 2];

			var dot = vx * nx + vy * ny + vz * nz;
			rx = 2 * dot * nx - vx;
			ry = 2 * dot * ny - vy;
			rz = 2 * dot * nz - vz;
			reflectedNormalsArray.push(rx);
			reflectedNormalsArray.push(ry);
			reflectedNormalsArray.push(rz);
		}
	}

	console.log(count);
	return {
		numVertices: count,
		vertices: new Float32Array(verticesArray),
		normals: new Float32Array(normalsArray),
		vertexNormals: new Float32Array(vertexNormalsArray),
	  reflectedNormals: new Float32Array(reflectedNormalsArray)
	};
}


// Loads an image file and returns a promise for the Image object,
// which can be used with an async/await, e.g.
//
// async function main()
// {
//    theImage = await loadImagePromise(filename);
//    ... (blocks here until file is loaded)
//
function loadImagePromise(filename)
{
  return new Promise(function (resolve) {
    var image = new Image();
    image.onload = function() { resolve(image); };

    // starts loading the image asynchronously
    image.src = imageFilename;
    }
  );
}

// Loads an OBJ file and returns an object with raw data for
// vertices, normals, and texture coordinates.
// Returns a promise, which can be used with an async/await,
// e.g.
//
// async function main()
// {
//    theModel = await loadOBJPromise(filename);
//    ... (blocks here until file is loaded)
//
function loadOBJPromise(filename)
{
  var doResolve;
  var callback = function(loadedModel, materials)
  {
    // assume only one object in the .obj file
    var child = loadedModel.children[0];

    // for the new (2015) obj file loader, this is an instance
    // of THREE.BufferGeometry, not THREE.Geometry, so we don't
    // use the getModelData function
    var geometry = child.geometry;
    theModel = new Object();
    theModel.numVertices = geometry.getAttribute('position').array.length /
      geometry.getAttribute('position').itemSize;
    theModel.vertices = geometry.getAttribute('position').array;
    theModel.vertexNormals = geometry.getAttribute('normal').array;
    if (theModel.texCoords = geometry.getAttribute('uv'))
    {
      theModel.texCoords = geometry.getAttribute('uv').array;
    }
    doResolve(theModel);
  };

  return new Promise(function (resolve) {
    doResolve = resolve; // move into outer scope
    var objLoader = new THREE.OBJLoader();
    objLoader.load(modelFilename, callback);
    }
  );
}
