#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D tex;
uniform int       height;
uniform int       width;

// Hue shift
mat4 colormatrix = mat4(-0.3333333, 0.6666667, 0.6666667, 0.0, 0.6666667, -0.3333333, 0.6666667, 0.0, 0.6666667, 0.6666667, -0.3333333, 0.0, 0.0, 0.0, 0.0, 1.0);

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv              = fragCoord.xy;
    vec4 color           = texture2D(tex, fragCoord / vec2(width, height));
    mat4 colormatrixDiff = mat4(colormatrix);
    fragColor            = colormatrixDiff * color;
}

void main() {
    mainImage(cogl_color_out, cogl_tex_coord_in[0].xy * vec2(width, height));
}
