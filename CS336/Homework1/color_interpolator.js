/**
 * Represents an RGBA color. Values should normally be in the range [0.0, 1.0].
 * @constructor
 * @param {Number} r - red value (default 0.0)
 * @param {Number} g - green value (default 0.0)
 * @param {Number} b - blue value (default 0.0)
 * @param {Number} a - alpha value (default 1.0)
 */
function Color(r, g, b, a)
{
	this.r = (r ? r : 0.0);
	this.g = (g ? g : 0.0);
	this.b = (b ? b : 0.0);
	this.a = (a ? a : 1.0);
}

/**
 * Interpolates a color value within a rectangle based on an
 * x, y offset from the lower left corner.  The base of the rectangle is
 * always aligned with the bottom of the canvas.  Returns null if the given
 * offset does not lie within the rectangle.
 * @param {Number} x - offset from left side
 * @param {Number} y - offset from bottom
 * @param {Number} base - base of rectangle
 * @param {Number} height - height of triangle
 * @param {Color[]} colors - colors of the four corners, counterclockwise
 *   from lower left
 * @return {Color} interpolated color at offset (x, y)
 */
function findRGB(x, y, width, height, colors)
{
    var w1; 
    var w2;
    var w3;
    
        w1 = (width*y) / (width*height);
        w2 = ((-height)*(x-width)) / (width*height);
        w3 = 1-w1-w2;
        var red = w1*colors[0].r + w2*colors[1].r + w3*colors[2].r;
        var green = w1*colors[0].g + w2*colors[1].g + w3*colors[2].g;
        var blue = w1*colors[0].b + w2*colors[1].b + w3*colors[2].b;
        return new Color(red, green, blue);
}

function startHere()
{
    var colors = [];
    colors[0] = new Color(1.0, 0.0, 0.0);
    colors[1] = new Color(0.0, 1.0, 0.0);
    colors[2] = new Color(0.0, 0.0, 1.0);
    colors[3] = new Color(0.0, 0.0, 0.0);
    
    console.log(findRGB(0.5, 0.5, 1, 1, colors));
}