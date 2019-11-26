

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;

// create the objects
var theObject = new CS336Object(drawCube);
var theObject2 = new CS336Object(drawCube);
var theObject3 = new CS336Object(drawCube);
var theObject4 = new CS336Object(drawCube);
var theObject5 = new CS336Object(drawCube);

// view matrix
var view = createLookAtMatrix(
               new THREE.Vector3(10, 10, 25),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis


// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
//var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);
var projection = createPerspectiveMatrix(30, 1.5, 1, 100);



// helper function renders the cube based on the given model transformation
function drawCube(matrix)
{
	  // bind the shader
	  gl.useProgram(lightingShader);

	  // get the index for the a_Position attribute defined in the vertex shader
	  var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
	  if (positionIndex < 0) {
	    console.log('Failed to get the storage location of a_Position');
	    return;
	  }

	  var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
	  if (normalIndex < 0) {
		    console.log('Failed to get the storage location of a_Normal');
		    return;
		  }

	  // "enable" the a_position attribute
	  gl.enableVertexAttribArray(positionIndex);
	  gl.enableVertexAttribArray(normalIndex);

	  // bind data for points and normals
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, null);

	  var loc = gl.getUniformLocation(lightingShader, "view");
	  gl.uniformMatrix4fv(loc, false, view.elements);
	  loc = gl.getUniformLocation(lightingShader, "projection");
	  gl.uniformMatrix4fv(loc, false, projection.elements);
	  loc = gl.getUniformLocation(lightingShader, "u_Color");
	  gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);
    var loc = gl.getUniformLocation(lightingShader, "lightPosition");
    gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);

	  var modelMatrixloc = gl.getUniformLocation(lightingShader, "model");
	  var normalMatrixLoc = gl.getUniformLocation(lightingShader, "normalMatrix");

	  gl.uniformMatrix4fv(modelMatrixloc, false, matrix.elements);
	  gl.uniformMatrix3fv(normalMatrixLoc, false, makeNormalMatrixElements(matrix, view));

	  gl.drawArrays(gl.TRIANGLES, 0, 36);

	  gl.useProgram(null);
}

// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

	// recursively render everything in the hierarchy
	theObject.render(new THREE.Matrix4());
    theObject2.render(new THREE.Matrix4());
    theObject3.render(new THREE.Matrix4());
    theObject4.render(new THREE.Matrix4());
    theObject5.render(new THREE.Matrix4());
}

// entry point when page is loaded
function main() {

  // get graphics context
  gl = getGraphicsContext("theCanvas");

  // create model data
  var cube = makeCube();
  //var cube2 = makeCube();

  // load and compile the shader pair
  lightingShader = createProgram(gl, 'vertexLightingShader', 'fragmentLightingShader');

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(cube.vertices);
  //vertexBuffer = createAndLoadBuffer(cube2.vertices);

  // buffer for vertex normals
  vertexNormalBuffer = createAndLoadBuffer(cube.normals);
  //vertexNormalBuffer = createAndLoadBuffer(cube2.normals);
    
  // specify a fill color for clearing the framebuffer
  gl.clearColor(0, 0, 0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  var rotation = 0;
  var increment = 0.5; //* Math.PI / 180.0;
  theObject2.moveUp(1);
  theObject2.rotateZ(increment);
  theObject3.moveUp(2);
  theObject3.rotateZ(increment);
  theObject4.moveUp(3);
  theObject5.moveUp(4);

  // define an animation loop
  var animate = function() {
  	draw();

    theObject.rotateZ(increment);
         
    theObject2.rotateZ(-increment);
    theObject2.moveDown(1);
    theObject2.rotateZ(increment);
    theObject2.moveUp(1);
    theObject2.rotateZ(increment*2);
      
    theObject3.rotateZ(-increment);
    theObject3.moveDown(1);
    theObject3.rotateZ(-increment);
    theObject3.moveDown(1);
    theObject3.rotateZ(increment);
    theObject3.moveUp(1);
    theObject3.rotateZ(increment*2);
    theObject3.moveUp(1);
    theObject3.rotateZ(increment*2);
      
    theObject4.moveDown(1);
    theObject4.rotateZ(increment);
    theObject4.moveUp(1);
    theObject4.rotateZ(increment);
      
    theObject5.moveDown(1);
    theObject5.rotateZ(increment);
    theObject5.moveUp(1);
    theObject5.rotateZ(increment);
      
    rotation += increment;
    if (rotation > 30 || rotation < -30 )
    {
      increment = -increment;
    }

    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
