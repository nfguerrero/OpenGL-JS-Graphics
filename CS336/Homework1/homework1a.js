// Same as GL_example1a but uses a uniform variable in the vertex
// shader to control the left or right shift of the model.  The shift is
// updated in each frame (see the bottom of the main method) to animate
// the model.

// Raw data for some point positions - this will be a square, consisting
// of two triangles.  We provide two values per vertex for the x and y coordinates
// (z will be zero by default).
var numPoints = 3;

//Scale variable
let scale = parseFloat(document.getElementById("scaleBox").value);

var center = new Float32Array([0,0.8]);
var dx = scale*Math.cos(Math.PI/6);
var dy = scale*Math.sin(Math.PI/6);

var vertices = new Float32Array([
  center[0], center[1]+scale,
  center[0]+dx, center[1]-dy,
  center[0]-dx, center[1]-dy
]
);

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;

// handle to the compiled shader program on the GPU
var shader;

var shift;
var shiftx;
var shifty;

// code to actually render our geometry
function draw(shiftValue, shiftValue2)
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT);

  // bind the shader
  gl.useProgram(shader);

  // bind the buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);    

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // associate the data in the currently bound buffer with the a_position attribute
  // (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
  // the last three args just yet.)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  // we can unbind the buffer now (not really necessary when there is only one buffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  let index = gl.getUniformLocation(shader, "shiftx");
  let index2 = gl.getUniformLocation(shader, "shifty")
  gl.uniform1f(index, shiftValue);
  gl.uniform1f(index2, shiftValue2);

  // draw, specifying the type of primitive to assemble from the vertices
  gl.drawArrays(gl.TRIANGLES, 0, numPoints);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {
  
  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

    // get graphics context
  gl = getGraphicsContext("theCanvas");

  // load and compile the shader pair
  shader = createProgram(gl, 'vertexShader', 'fragmentShader');    

  // load the vertex data into GPU memory
  vertexbuffer = createAndLoadBuffer(vertices);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(1.0, 1.0, 0.0, 1.0);

  // we could just call draw() once to see the result, but setting up an animation
  // loop to continually update the canvas makes it easier to experiment with the
  // shaders
  //draw();

  let shiftx = 0;
  let shifty = 0.8;
  let xinc = 1;

  // define an animation loop
  var animate = function() {
      
    //if  (shift < -0.2 || shift > 0.2) increment = -increment;
    //shift += increment;
      //shiftx += 0.003;
      shifty = 0.8*Math.sin(Math.atan((shifty/shiftx)-Math.PI/180));
      
      console.log(shiftx);
      if (shiftx >= 1) xinc = -1;
      if (shiftx <= -1) xinc = 1;
      
      shiftx += xinc*0.8*Math.cos(Math.atan((shifty/shiftx)-Math.PI/180));
      
      console.log(shiftx);
      
	draw(shiftx, shifty);
      
	// request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
